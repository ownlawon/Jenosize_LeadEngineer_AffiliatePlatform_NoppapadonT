import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional } from "class-validator";

export class ExportClicksDto {
  @ApiProperty({
    required: false,
    example: "2026-01-01",
    description: "ISO date (YYYY-MM-DD). Defaults to 30 days ago.",
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({
    required: false,
    example: "2026-12-31",
    description: "ISO date (YYYY-MM-DD). Defaults to today.",
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
