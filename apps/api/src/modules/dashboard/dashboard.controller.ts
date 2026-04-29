import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DashboardService } from "./dashboard.service";
import { ExportClicksDto } from "./export.dto";

@ApiTags("dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: "Aggregate stats: total clicks, by marketplace, by campaign",
  })
  summary() {
    return this.dashboard.summary();
  }

  @Get("top-products")
  @ApiOperation({ summary: "Top products by clicks" })
  topProducts(@Query("limit") limit?: string) {
    const n = limit ? Math.min(50, Math.max(1, parseInt(limit, 10) || 10)) : 10;
    return this.dashboard.topProducts(n);
  }

  @Get("export/clicks.csv")
  @ApiOperation({
    summary: "Export Click rows (joined with product + campaign) as CSV",
  })
  @ApiProduces("text/csv")
  @Header("content-type", "text/csv; charset=utf-8")
  async exportClicks(@Query() q: ExportClicksDto, @Res() res: Response) {
    let csv: string;
    try {
      csv = await this.dashboard.exportClicksCsv({ from: q.from, to: q.to });
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader(
      "content-disposition",
      `attachment; filename="clicks-${stamp}.csv"`,
    );
    res.send(csv);
  }
}
