import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check del API Gateway' })
  @ApiResponse({ status: 200, description: 'Gateway is healthy' })
  @HealthCheck()
  check() {
    return this.health.check([
      // Check AI Service
      async () =>
        this.http.pingCheck(
          'ai-service',
          process.env.AI_SERVICE_URL || 'http://localhost:8000',
        ),
      // Check SRI Service
      async () =>
        this.http.pingCheck(
          'sri-service',
          process.env.SRI_SERVICE_URL || 'http://localhost:9000',
        ),
      // Check Auth Service
      async () =>
        this.http.pingCheck(
          'auth-service',
          process.env.AUTH_SERVICE_URL || 'http://localhost:3000',
        ),
    ]);
  }

  @Get('simple')
  @ApiOperation({ summary: 'Simple health check' })
  @ApiResponse({ status: 200, description: 'OK' })
  simpleCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    };
  }
}
