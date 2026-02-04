import { Module, Global } from '@nestjs/common';
import { ServiceDiscoveryService } from './service-discovery.service';

@Global()
@Module({
  providers: [ServiceDiscoveryService],
  exports: [ServiceDiscoveryService],
})
export class ServiceDiscoveryModule {}
