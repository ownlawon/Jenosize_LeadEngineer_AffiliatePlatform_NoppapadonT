import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BootstrapService } from '../bootstrap/bootstrap.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly bootstrap: BootstrapService) {}

  @Post('reset-demo')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Wipe domain data and re-seed the six-product demo catalogue',
    description:
      'Removes all clicks/links/campaigns/offers/products, then re-runs the ' +
      'fixture seed. Admin users are preserved. Intended for demo reset only.',
  })
  resetDemo() {
    return this.bootstrap.wipeAndReseed();
  }
}
