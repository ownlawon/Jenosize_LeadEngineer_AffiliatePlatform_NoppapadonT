import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PaginationQueryDto } from "../../common/pagination.dto";
import { LinksService } from "./links.service";
import { CreateLinkDto } from "./dto";

@ApiTags("links")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("links")
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Post()
  @ApiOperation({
    summary:
      "Generate an affiliate short link for a product+campaign+marketplace",
  })
  create(@Body() dto: CreateLinkDto) {
    return this.links.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List links (paginated, with click counts)" })
  findAll(@Query() q: PaginationQueryDto) {
    return this.links.findAll(q.page, q.pageSize);
  }

  @Get(":id/analytics")
  @ApiOperation({
    summary: "Per-link drill-down — clicks, impressions, CTR, last 7 days",
  })
  analytics(@Param("id") id: string) {
    return this.links.analytics(id);
  }
}
