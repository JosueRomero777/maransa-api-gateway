import { HttpService } from '@nestjs/axios';
import { ServiceDiscoveryService } from '../service-discovery/service-discovery.service';
export declare class ProxyService {
    private readonly httpService;
    private readonly serviceDiscovery;
    private readonly logger;
    constructor(httpService: HttpService, serviceDiscovery: ServiceDiscoveryService);
    forwardRequest(serviceName: string, path: string, method: string, body: any, headers: Record<string, string>, query: any, req?: any): Promise<any>;
    getServiceNameFromRoute(route: string): string;
    transformPath(originalPath: string, serviceName: string): string;
}
