import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { customAlphabet } from "nanoid";
import { Marketplace } from "@prisma/client";

import { LinkAnalytics, LinkDto } from "@jenosize/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { PaginatedResult, buildPaginated } from "../../common/pagination.dto";
import { CreateLinkDto } from "./dto";

// Confusable-free alphabet (no 0/O/1/l/I) — keeps 6 chars unambiguous when
// dictated/typed. 57^6 ≈ 3.4 × 10^10 possible codes, plenty of headroom for
// the MVP scope; collisions are retried on insert.
const SHORT_CODE_ALPHABET =
  "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateShortCode = customAlphabet(SHORT_CODE_ALPHABET, 6);

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateLinkDto): Promise<LinkDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { offers: { where: { marketplace: dto.marketplace } } },
    });
    if (!product)
      throw new NotFoundException(`Product ${dto.productId} not found`);

    const offer = product.offers[0];
    if (!offer) {
      throw new BadRequestException(
        `Product has no offer for ${dto.marketplace} — add the marketplace first`,
      );
    }

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
    });
    if (!campaign)
      throw new NotFoundException(`Campaign ${dto.campaignId} not found`);

    // Reuse existing link if (product, campaign, marketplace) already exists
    const existing = await this.prisma.link.findUnique({
      where: {
        productId_campaignId_marketplace: {
          productId: dto.productId,
          campaignId: dto.campaignId,
          marketplace: dto.marketplace as Marketplace,
        },
      },
    });
    if (existing) return this.toDto({ ...existing, clickCount: 0 });

    let shortCode = generateShortCode();
    // Collision retry (very unlikely with 8 chars over ~57 alphabet)
    for (let i = 0; i < 5; i++) {
      const dup = await this.prisma.link.findUnique({ where: { shortCode } });
      if (!dup) break;
      shortCode = generateShortCode();
    }

    const link = await this.prisma.link.create({
      data: {
        productId: dto.productId,
        campaignId: dto.campaignId,
        marketplace: dto.marketplace as Marketplace,
        shortCode,
        targetUrl: offer.externalUrl,
      },
    });
    return this.toDto({ ...link, clickCount: 0 });
  }

  async findAll(page = 1, pageSize = 20): Promise<PaginatedResult<LinkDto>> {
    const [total, links] = await this.prisma.$transaction([
      this.prisma.link.count(),
      this.prisma.link.findMany({
        include: { _count: { select: { clicks: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const items = links.map((l) =>
      this.toDto({ ...l, clickCount: l._count.clicks }),
    );
    return buildPaginated(items, total, page, pageSize);
  }

  /**
   * Per-link drill-down for `/admin/links/:id`. Returns the link's metadata
   * plus its own clicks/impressions/CTR + last-7-days breakdown so the
   * detail page can render charts and copy without the dashboard's
   * cross-link aggregation.
   */
  async analytics(id: string): Promise<LinkAnalytics> {
    const link = await this.prisma.link.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, title: true, imageUrl: true } },
        campaign: { select: { id: true, name: true, utmCampaign: true } },
      },
    });
    if (!link) throw new NotFoundException(`Link ${id} not found`);

    const [clicks, impressions, last7Clicks, last7Impressions] =
      await Promise.all([
        this.prisma.click.count({ where: { linkId: id } }),
        this.prisma.impression.count({ where: { linkId: id } }),
        this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT DATE_TRUNC('day', "timestamp") AS day, COUNT(*) AS count
        FROM "Click"
        WHERE "linkId" = ${id} AND "timestamp" >= NOW() - INTERVAL '6 days'
        GROUP BY day ORDER BY day ASC
      `,
        this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT DATE_TRUNC('day', "timestamp") AS day, COUNT(*) AS count
        FROM "Impression"
        WHERE "linkId" = ${id} AND "timestamp" >= NOW() - INTERVAL '6 days'
        GROUP BY day ORDER BY day ASC
      `,
      ]);

    const ctr = impressions > 0 ? clicks / impressions : null;

    const days: Array<{
      date: string;
      clicks: number;
      impressions: number;
    }> = [];
    const clickMap = new Map(
      last7Clicks.map((r) => [
        new Date(r.day).toISOString().slice(0, 10),
        Number(r.count),
      ]),
    );
    const imprMap = new Map(
      last7Impressions.map((r) => [
        new Date(r.day).toISOString().slice(0, 10),
        Number(r.count),
      ]),
    );
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        clicks: clickMap.get(key) ?? 0,
        impressions: imprMap.get(key) ?? 0,
      });
    }

    return {
      link: this.toDto({ ...link, clickCount: clicks }),
      product: link.product,
      campaign: link.campaign,
      clicks,
      impressions,
      ctr,
      last7Days: days,
    };
  }

  toDto(l: {
    id: string;
    shortCode: string;
    productId: string;
    campaignId: string;
    marketplace: Marketplace;
    targetUrl: string;
    createdAt: Date;
    clickCount?: number;
  }): LinkDto {
    const base =
      this.config.get<string>("SHORT_LINK_BASE_URL") ?? "http://localhost:3001";
    return {
      id: l.id,
      shortCode: l.shortCode,
      shortUrl: `${base.replace(/\/$/, "")}/go/${l.shortCode}`,
      productId: l.productId,
      campaignId: l.campaignId,
      marketplace: l.marketplace,
      targetUrl: l.targetUrl,
      createdAt: l.createdAt.toISOString(),
      clickCount: l.clickCount,
    };
  }
}
