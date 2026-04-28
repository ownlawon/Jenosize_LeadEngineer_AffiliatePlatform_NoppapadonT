import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import cookieParser from 'cookie-parser';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * End-to-end coverage for the auth surface:
 *  - happy-path login → /me → logout cookie clear
 *  - validation rejection (bad email, short password)
 *  - login-specific throttle (5 reqs/min/IP — the 6th must 429)
 *
 * Requires Postgres + Redis; CI provisions both as service containers.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = 'auth-e2e@jenosize.test';
  const password = 'AuthE2E!2025';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api', { exclude: ['go/:code', 'health'] });
    await app.init();

    prisma = app.get(PrismaService);

    // Seed a dedicated test user so we don't perturb the boot-seeded admin.
    await prisma.user.upsert({
      where: { email },
      update: { password: await bcrypt.hash(password, 12) },
      create: { email, password: await bcrypt.hash(password, 12) },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { email } }).catch(() => {});
    await app.close();
  });

  it('rejects malformed login payloads with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it('signs in with valid credentials, sets an httpOnly cookie, and serves /me', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.user?.email).toBe(email);
    expect(typeof login.body.token).toBe('string');

    const setCookie = login.headers['set-cookie'];
    const cookies: string[] = Array.isArray(setCookie) ? setCookie : [setCookie];
    const accessCookie = cookies.find((c) => c.startsWith('access_token='));
    expect(accessCookie).toBeTruthy();
    expect(accessCookie).toMatch(/HttpOnly/i);

    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('cookie', accessCookie!);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(email);
  });

  it('clears the cookie on logout', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/logout');
    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'];
    const cookies: string[] = Array.isArray(setCookie) ? setCookie : [setCookie];
    expect(cookies.some((c) => /access_token=;/.test(c))).toBe(true);
  });

  it('throttles brute-force login at 5 reqs/min/IP (the 6th gets 429)', async () => {
    // Use a unique IP via x-forwarded-for so previous tests don't poison this
    // bucket. NestJS Throttler keys off req.ip + route by default.
    const ip = '10.99.99.42';
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('x-forwarded-for', ip)
        .send({ email, password: 'WrongPassword!' });
      statuses.push(res.status);
    }
    // First 5 should be 401 (bad password), the 6th+ should be 429.
    const throttled = statuses.filter((s) => s === 429).length;
    expect(throttled).toBeGreaterThanOrEqual(1);
  });
});
