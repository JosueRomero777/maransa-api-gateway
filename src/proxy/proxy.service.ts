import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { ServiceDiscoveryService } from '../service-discovery/service-discovery.service';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  /**
   * Forward request to target microservice
   */
  async forwardRequest(
    serviceName: string,
    path: string,
    method: string,
    body: any,
    headers: Record<string, string>,
    query: any,
  ): Promise<any> {
    try {
      // Get service URL from service discovery
      const baseUrl = await this.serviceDiscovery.getServiceUrl(serviceName);
      const url = `${baseUrl}${path}`;

      this.logger.debug(`Forwarding ${method} ${url}`);

      // Prepare request config
      const config: AxiosRequestConfig = {
        method: method.toLowerCase() as any,
        url,
        headers: {
          ...headers,
          'X-Forwarded-For': headers['x-forwarded-for'] || 'api-gateway',
          'X-Gateway': 'maransa-api-gateway',
        },
        params: query,
        timeout: 30000, // 30s timeout
      };

      // Add body for POST, PUT, PATCH
      if (['post', 'put', 'patch'].includes(method.toLowerCase()) && body) {
        config.data = body;
      }

      // Execute request
      const response = await firstValueFrom(this.httpService.request(config));

      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      this.logger.error(
        `Error forwarding request to ${serviceName}: ${error.message}`,
      );

      // Forward error status and message
      if (error.response) {
        throw new HttpException(
          error.response.data || error.message,
          error.response.status,
        );
      }

      throw new HttpException(
        `Service ${serviceName} unavailable`,
        503,
      );
    }
  }

  /**
   * Map route prefix to service name
   */
  getServiceNameFromRoute(route: string): string {
    // External microservices (always separate)
    if (route.startsWith('/api/ai')) return 'ai-service';
    if (route.startsWith('/api/sri')) return 'sri-service';

    // Backend routes - check if using monolith or microservices
    const useMonolith = !!process.env.BACKEND_MONOLITH_URL;
    
    if (useMonolith) {
      // OPCIÓN 1: Todo va al backend monolito
      return 'backend-monolith';
    } else {
      // OPCIÓN 2: Microservicios separados
      if (route.startsWith('/api/auth')) return 'auth-service';
      if (route.startsWith('/api/users')) return 'auth-service';
      if (route.startsWith('/api/orders')) return 'orders-service';
      if (route.startsWith('/api/providers')) return 'orders-service';
      if (route.startsWith('/api/packagers')) return 'orders-service';
      if (route.startsWith('/api/receptions')) return 'orders-service';
      if (route.startsWith('/api/laboratory')) return 'orders-service';
      if (route.startsWith('/api/harvest')) return 'orders-service';
      if (route.startsWith('/api/logistics')) return 'logistics-service';
      if (route.startsWith('/api/custody')) return 'logistics-service';
      if (route.startsWith('/api/invoicing')) return 'invoicing-service';

      return 'auth-service'; // Default
    }
  }

  /**
   * Transform route to service-specific path
   */
  transformPath(originalPath: string, serviceName: string): string {
    // Backend monolith keeps /api prefix (or remove it based on your backend)
    if (serviceName === 'backend-monolith') {
      // Tu backend espera rutas sin /api prefix
      return originalPath.replace('/api', '');
    }

    // External services (AI, SRI) keep /api
    if (serviceName === 'ai-service' || serviceName === 'sri-service') {
      return originalPath; // Keep /api/ai, /api/sri
    }

    // Microservices mode: remove /api prefix
    if (serviceName.includes('service') && originalPath.startsWith('/api/')) {
      return originalPath.replace('/api', '');
    }
    
    return originalPath;
  }
}
