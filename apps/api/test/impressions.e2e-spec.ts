import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Prisma } from "@prisma/client";
import request from "supertest";
import cookieParser from "cookie-parser";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

/**
 * End-to-end tests for the impression-tracking endpoint that backs the
 * dashboard CTR metric. The endpoint is intentionally public — shoppers
 * on the landing page fire it via IntersectionObserver — so we test
 * both the happy path and the abuse cases (unknown linkIds, oversized
 * batch, malformed body).
 */
describe("Impressions /api/impressions (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let linkIdA: string;
  let linkIdB: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix("api", { exclude: ["go/:code", "health"] });
    await app.init();

    prisma = app.get(PrismaService);

    // Reset rows touched by this suite. Order respects FK chain.
    await prisma.impression.deleteMany();
    await prisma.click.deleteMany();
    await prisma.link.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.product.deleteMany();
    await prisma.campaign.deleteMany();

    const product = await prisma.product.create({
      data: {
        title: "Impression Test Product",
        imageUrl: "https://example.com/img.jpg",
      },
    });
    await prisma.offer.create({
      data: {
        productId: product.id,
        marketplace: "LAZADA",
        storeName: "Test Shop",
        price: new Prisma.Decimal(99),
        currency: "THB",
        externalUrl: "https://www.lazada.co.th/products/x.html",
        externalId: "x",
      },
    });
    const campaign = await prisma.campaign.create({
      data: {
        name: "Impression Test Campaign",
        utmCampaign: "imp_e2e",
        utmSource: "jenosize",
        utmMedium: "affiliate",
        startAt: new Date("2020-01-01"),
        endAt: new Date("2099-12-31"),
      },
    });
    const linkA = await prisma.link.create({
      data: {
        productId: product.id,
        campaignId: campaign.id,
        marketplace: "LAZADA",
        shortCode: "impa01",
        targetUrl: "https://www.lazada.co.th/products/x.html",
      },
    });
    const linkB = await prisma.link.create({
      data: {
        productId: product.id,
        campaignId: campaign.id,
        marketplace: "SHOPEE",
        shortCode: "impb02",
        targetUrl: "https://shopee.co.th/x",
      },
    });
    linkIdA = linkA.id;
    linkIdB = linkB.id;
  });

  beforeEach(async () => {
    // Each test starts with a clean impression slate so counts are
    // assertable without coupling to test ordering.
    await prisma.impression.deleteMany();
  });

  afterAll(async () => {
    await prisma.impression.deleteMany();
    await app.close();
  });

  it("records impressions for valid linkIds and returns 202", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/impressions")
      .set("referer", "https://shopper.example.com/c/123")
      .set("user-agent", "jest-imp-agent")
      .send({ linkIds: [linkIdA, linkIdB] })
      .expect(202);

    expect(res.body).toEqual({ recorded: 2 });

    const rows = await prisma.impression.findMany({
      where: { linkId: { in: [linkIdA, linkIdB] } },
      orderBy: { timestamp: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].userAgent).toBe("jest-imp-agent");
    expect(rows[0].referrer).toBe("https://shopper.example.com/c/123");
    expect(rows[0].ipHash).toBeDefined();
  });

  it("silently drops unknown linkIds (FK guard)", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/impressions")
      .send({ linkIds: ["cln0n3xistent", "cln0t4real"] })
      .expect(202);

    expect(res.body).toEqual({ recorded: 0 });
    const rows = await prisma.impression.count();
    expect(rows).toBe(0);
  });

  it("de-duplicates linkIds within a single batch", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/impressions")
      .send({ linkIds: [linkIdA, linkIdA, linkIdA, linkIdB, linkIdB] })
      .expect(202);

    // Recording must not multiply by repetition — Set() inside service
    // enforces one row per linkId per batch.
    expect(res.body).toEqual({ recorded: 2 });
  });

  it("rejects empty linkIds with 400", async () => {
    await request(app.getHttpServer())
      .post("/api/impressions")
      .send({ linkIds: [] })
      .expect(400);
  });

  it("rejects oversized batch (>50 ids) with 400", async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `id-${i}`);
    await request(app.getHttpServer())
      .post("/api/impressions")
      .send({ linkIds: ids })
      .expect(400);
  });

  it("rejects malformed body (missing linkIds) with 400", async () => {
    await request(app.getHttpServer())
      .post("/api/impressions")
      .send({ wrongField: "oops" })
      .expect(400);
  });
});
