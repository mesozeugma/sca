import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthConfigService } from './auth.config';
import { AuthService } from './auth.service';

@Module({
  exports: [AuthService],
  imports: [ConfigModule],
  providers: [AuthConfigService, AuthService],
})
export class AuthModule {}
