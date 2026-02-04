import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Consul from 'consul';

export interface ServiceInstance {
  id: string;
  name: string;
  address: string;
  port: number;
  url: string;
}

@Injectable()
export class ServiceDiscoveryService implements OnModuleInit {
  private readonly logger = new Logger(ServiceDiscoveryService.name);
  private consul: Consul.Consul;
  private consulEnabled = false;
  private serviceCache = new Map<string, ServiceInstance[]>();

  async onModuleInit() {
    // Initialize Consul if configured
    if (process.env.CONSUL_HOST) {
      try {
        this.consul = new Consul({
          host: process.env.CONSUL_HOST || 'localhost',
          port: process.env.CONSUL_PORT || '8500',
        });
        this.consulEnabled = true;
        this.logger.log('✅ Consul client initialized');

        // Start periodic refresh
        setInterval(() => this.refreshServices(), 30000);
      } catch (error) {
        this.logger.warn('⚠️  Consul not available, using static configuration');
      }
    }
  }

  /**
   * Get service URL by name
   * If Consul is available, uses service discovery
   * Otherwise, falls back to environment variables
   */
  async getServiceUrl(serviceName: string): Promise<string> {
    if (this.consulEnabled) {
      const instances = await this.getServiceInstances(serviceName);
      if (instances.length > 0) {
        // Simple round-robin load balancing
        const instance = instances[Math.floor(Math.random() * instances.length)];
        return instance.url;
      }
    }

    // Fallback to environment variables
    return this.getFallbackUrl(serviceName);
  }

  /**
   * Get all instances of a service from Consul
   */
  private async getServiceInstances(
    serviceName: string,
  ): Promise<ServiceInstance[]> {
    if (!this.consulEnabled) {
      return [];
    }

    try {
      // Check cache first
      const cached = this.serviceCache.get(serviceName);
      if (cached) {
        return cached;
      }

      const result = await this.consul.health.service({
        service: serviceName,
        passing: true, // Only healthy instances
      });

      const instances: ServiceInstance[] = result.map((entry: any) => ({
        id: entry.Service.ID,
        name: entry.Service.Service,
        address: entry.Service.Address || entry.Node.Address,
        port: entry.Service.Port,
        url: `http://${entry.Service.Address || entry.Node.Address}:${entry.Service.Port}`,
      }));

      this.serviceCache.set(serviceName, instances);
      return instances;
    } catch (error) {
      this.logger.error(
        `Error fetching service ${serviceName} from Consul: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Refresh service cache
   */
  private async refreshServices() {
    if (!this.consulEnabled) {
      return;
    }

    const serviceNames = [
      'auth-service',
      'orders-service',
      'logistics-service',
      'invoicing-service',
      'ai-service',
      'sri-service',
    ];

    for (const serviceName of serviceNames) {
      this.serviceCache.delete(serviceName);
      await this.getServiceInstances(serviceName);
    }

    this.logger.debug('Service cache refreshed');
  }

  /**
   * Fallback URLs from environment variables
   */
  private getFallbackUrl(serviceName: string): string {
    // Check if using monolith mode
    if (serviceName === 'backend-monolith') {
      return process.env.BACKEND_MONOLITH_URL || 'http://localhost:3000';
    }

    const urlMap: Record<string, string> = {
      // Microservices mode URLs
      'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:3000',
      'orders-service':
        process.env.ORDERS_SERVICE_URL || 'http://localhost:3001',
      'logistics-service':
        process.env.LOGISTICS_SERVICE_URL || 'http://localhost:3002',
      'invoicing-service':
        process.env.INVOICING_SERVICE_URL || 'http://localhost:3003',
      
      // External microservices (always separate)
      'ai-service': process.env.AI_SERVICE_URL || 'http://localhost:8000',
      'sri-service': process.env.SRI_SERVICE_URL || 'http://localhost:9000',
    };

    return urlMap[serviceName] || 'http://localhost:3000';
  }

  /**
   * List all services
   */
  async listServices(): Promise<string[]> {
    if (!this.consulEnabled) {
      return Object.keys(this.getAllServiceUrls());
    }

    try {
      const services = await this.consul.catalog.service.list();
      return Object.keys(services);
    } catch (error) {
      this.logger.error(`Error listing services: ${error.message}`);
      return [];
    }
  }

  /**
   * Get all service URLs
   */
  private getAllServiceUrls(): Record<string, string> {
    const useMonolith = !!process.env.BACKEND_MONOLITH_URL;

    if (useMonolith) {
      return {
        'backend-monolith': process.env.BACKEND_MONOLITH_URL || 'http://localhost:3000',
        'ai-service': process.env.AI_SERVICE_URL || 'http://localhost:8000',
        'sri-service': process.env.SRI_SERVICE_URL || 'http://localhost:9000',
      };
    }

    return {
      'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:3000',
      'orders-service':
        process.env.ORDERS_SERVICE_URL || 'http://localhost:3001',
      'logistics-service':
        process.env.LOGISTICS_SERVICE_URL || 'http://localhost:3002',
      'invoicing-service':
        process.env.INVOICING_SERVICE_URL || 'http://localhost:3003',
      'ai-service': process.env.AI_SERVICE_URL || 'http://localhost:8000',
      'sri-service': process.env.SRI_SERVICE_URL || 'http://localhost:9000',
    };
  }
}
