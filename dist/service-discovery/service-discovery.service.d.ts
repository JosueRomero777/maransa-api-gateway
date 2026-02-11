import { OnModuleInit } from '@nestjs/common';
export interface ServiceInstance {
    id: string;
    name: string;
    address: string;
    port: number;
    url: string;
}
export declare class ServiceDiscoveryService implements OnModuleInit {
    private readonly logger;
    private consul;
    private consulEnabled;
    private serviceCache;
    onModuleInit(): Promise<void>;
    getServiceUrl(serviceName: string): Promise<string>;
    private getServiceInstances;
    private refreshServices;
    private getFallbackUrl;
    listServices(): Promise<string[]>;
    private getAllServiceUrls;
}
