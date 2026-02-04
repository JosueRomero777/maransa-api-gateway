import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { ProxyModule } from './proxy/proxy.module';
import { ServiceDiscoveryModule } from './service-discovery/service-discovery.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),

    // Custom Modules
    HealthModule,
    ServiceDiscoveryModule,
    AuthModule,
    ProxyModule, // Must be last - contains wildcard routes
  ],
})
export class AppModule {}
