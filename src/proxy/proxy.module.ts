import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ServiceDiscoveryModule } from '../service-discovery/service-discovery.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, ServiceDiscoveryModule, AuthModule],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
