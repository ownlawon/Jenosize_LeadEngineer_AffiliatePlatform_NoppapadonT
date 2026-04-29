import { Injectable } from "@nestjs/common";
import { Marketplace } from "@prisma/client";
import { stringify } from "csv-stringify/sync";

import { DashboardSummary, TopProduct } from "@jenosize/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(): Promise<DashboardSummary> {
    const now = new Date();
    const [
      totalClicks,
      totalLinks,
      totalProducts,
      totalCampaigns,
      activeCampaigns,
      totalImpressions,
      byMarketplaceRows,
      byCampaignRows,
      last7,
    ] = await Promise.all([
      this.prisma.click.count(),
      this.prisma.link.count(),
      this.prisma.product.count(),
      this.prisma.campaign.count(),
      this.prisma.campaign.count({
        where: { startAt: { lte: now }, endAt: { gte: now } },
      }),
      this.prisma.impression.count(),
      this.prisma.$queryRaw<
        Array<{ marketplace: Marketplace; clicks: bigint }>
      >`
        SELECT l."marketplace" AS marketplace, COUNT(c.*) AS clicks
        FROM "Link" l
        LEFT JOIN "Click" c ON c."linkId" = l."id"
        GROUP BY l."marketplace"
      `,
      this.prisma.$queryRaw<
        Array<{ id: string; name: string; clicks: bigint }>
      >`
        SELECT cm."id", cm."name", COUNT(c.*) AS clicks
        FROM "Campaign" cm
        LEFT JOIN "Link" l ON l."campaignId" = cm."id"
        LEFT JOIN "Click" c ON c."linkId" = l."id"
        GROUP BY cm."id", cm."name"
        ORDER BY clicks DESC
      `,
      this.prisma.$queryRaw<Array<{ day: Date; clicks: bigint }>>`
        SELECT DATE_TRUNC('day', "timestamp") AS day, COUNT(*) AS clicks
        FROM "Click"
        WHERE "timestamp" >= NOW() - INTERVAL '6 days'
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

    const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : null;

    return {
      totalClicks,
      totalLinks,
      totalProducts,
      totalCampaigns,
      activeCampaigns,
      totalImpressions,
      ctr,
      byMarketplace: byMarketplaceRows.map((r) => ({
        marketplace: r.marketplace,
        clicks: Number(r.clicks),
      })),
      byCampaign: byCampaignRows.map((r) => ({
        campaignId: r.id,
        name: r.name,
        clicks: Number(r.clicks),
      })),
      clicksLast7Days: this.fillDays(last7),
    };
  }

  async topProducts(limit = 10): Promise<TopProduct[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; title: string; image_url: string; clicks: bigint }>
    >`
      SELECT p."id", p."title", p."imageUrl" AS image_url, COUNT(c.*) AS clicks
      FROM "Product" p
      LEFT JOIN "Link" l ON l."productId" = p."id"
      LEFT JOIN "Click" c ON c."linkId" = l."id"
      GROUP BY p."id", p."title", p."imageUrl"
      ORDER BY clicks DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      productId: r.id,
      title: r.title,
      imageUrl: r.image_url,
      clicks: Number(r.clicks),
    }));
  }

  /**
   * Export raw click rows joined with product/campaign as CSV. Used by the
   * "Export CSV" button on the admin dashboard so marketing teams can
   * import attribution data into spreadsheets / BI tools without standing
   * up a warehouse pipeline.
   *
   * Date range defaults to the last 30 days; window capped at 366 days
   * so an over-broad query can't OOM the Node process.
   */
  async exportClicksCsv(opts: { from?: string; to?: string }): Promise<string> {
    const now = new Date();
    const to = opts.to ? new Date(`${opts.to}T23:59:59.999Z`) : now;
    const defaultFrom = new Date(now);
    defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 30);
    const from = opts.from
      ? new Date(`${opts.from}T00:00:00.000Z`)
      : defaultFrom;

    const ONE_YEAR_MS = 366 * 24 * 60 * 60 * 1000;
    if (to.getTime() - from.getTime() > ONE_YEAR_MS) {
      throw new Error("Date range too wide — max 1 year per export");
    }

    const clicks = await this.prisma.click.findMany({
      where: { timestamp: { gte: from, lte: to } },
      include: {
        link: {
          include: {
            product: { select: { id: true, title: true } },
            campaign: { select: { id: true, name: true, utmCampaign: true } },
          },
        },
      },
      orderBy: { timestamp: "asc" },
    });

    const rows = clicks.map((c) => ({
      timestamp: c.timestamp.toISOString(),
      click_id: c.id,
      short_code: c.link.shortCode,
      marketplace: c.link.marketplace,
      product_id: c.link.product.id,
      product_title: c.link.product.title,
      campaign_id: c.link.campaign.id,
      campaign_name: c.link.campaign.name,
      utm_campaign: c.link.campaign.utmCampaign,
      referrer: c.referrer ?? "",
      user_agent: c.userAgent ?? "",
    }));

    return stringify(rows, {
      header: true,
      columns: [
        "timestamp",
        "click_id",
        "short_code",
        "marketplace",
        "product_id",
        "product_title",
        "campaign_id",
        "campaign_name",
        "utm_campaign",
        "referrer",
        "user_agent",
      ],
    });
  }

  /** Pad the last 7 days so the chart shows zeros for empty days. */
  private fillDays(rows: Array<{ day: Date; clicks: bigint }>) {
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = new Date(r.day).toISOString().slice(0, 10);
      map.set(key, Number(r.clicks));
    }
    const result: Array<{ date: string; clicks: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, clicks: map.get(key) ?? 0 });
    }
    return result;
  }
}
