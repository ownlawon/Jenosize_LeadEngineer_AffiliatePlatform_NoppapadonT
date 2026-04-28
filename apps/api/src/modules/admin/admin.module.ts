import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { BootstrapModule } from '../bootstrap/bootstrap.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule, BootstrapModule],
  controllers: [AdminController],
})
export class AdminModule {}
