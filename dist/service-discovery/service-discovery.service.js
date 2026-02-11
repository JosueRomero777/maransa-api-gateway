"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ServiceDiscoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceDiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const Consul = require("consul");
let ServiceDiscoveryService = ServiceDiscoveryService_1 = class ServiceDiscoveryService {
    constructor() {
        this.logger = new common_1.Logger(ServiceDiscoveryService_1.name);
        this.consulEnabled = false;
        this.serviceCache = new Map();
    }
    async onModuleInit() {
        if (process.env.CONSUL_HOST) {
            try {
                this.consul = new Consul({
                    host: process.env.CONSUL_HOST || 'localhost',
                    port: process.env.CONSUL_PORT || '8500',
                });
                this.consulEnabled = true;
                this.logger.log('✅ Consul client initialized');
                setInterval(() => this.refreshServices(), 30000);
            }
            catch (error) {
                this.logger.warn('⚠️  Consul not available, using static configuration');
            }
        }
    }
    async getServiceUrl(serviceName) {
        if (this.consulEnabled) {
            const instances = await this.getServiceInstances(serviceName);
            if (instances.length > 0) {
                const instance = instances[Math.floor(Math.random() * instances.length)];
                return instance.url;
            }
        }
        return this.getFallbackUrl(serviceName);
    }
    async getServiceInstances(serviceName) {
        if (!this.consulEnabled) {
            return [];
        }
        try {
            const cached = this.serviceCache.get(serviceName);
            if (cached) {
                return cached;
            }
            const result = await this.consul.health.service({
                service: serviceName,
                passing: true,
            });
            const instances = result.map((entry) => ({
                id: entry.Service.ID,
                name: entry.Service.Service,
                address: entry.Service.Address || entry.Node.Address,
                port: entry.Service.Port,
                url: `http://${entry.Service.Address || entry.Node.Address}:${entry.Service.Port}`,
            }));
            this.serviceCache.set(serviceName, instances);
            return instances;
        }
        catch (error) {
            this.logger.error(`Error fetching service ${serviceName} from Consul: ${error.message}`);
            return [];
        }
    }
    async refreshServices() {
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
    getFallbackUrl(serviceName) {
        if (serviceName === 'backend-monolith') {
            return process.env.BACKEND_MONOLITH_URL || 'http://localhost:3000';
        }
        const urlMap = {
            'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:3000',
            'orders-service': process.env.ORDERS_SERVICE_URL || 'http://localhost:3001',
            'logistics-service': process.env.LOGISTICS_SERVICE_URL || 'http://localhost:3002',
            'invoicing-service': process.env.INVOICING_SERVICE_URL || 'http://localhost:3003',
            'ai-service': process.env.AI_SERVICE_URL || 'http://localhost:8000',
            'sri-service': process.env.SRI_SERVICE_URL || 'http://localhost:9000',
        };
        return urlMap[serviceName] || 'http://localhost:3000';
    }
    async listServices() {
        if (!this.consulEnabled) {
            return Object.keys(this.getAllServiceUrls());
        }
        try {
            const services = await this.consul.catalog.service.list();
            return Object.keys(services);
        }
        catch (error) {
            this.logger.error(`Error listing services: ${error.message}`);
            return [];
        }
    }
    getAllServiceUrls() {
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
            'orders-service': process.env.ORDERS_SERVICE_URL || 'http://localhost:3001',
            'logistics-service': process.env.LOGISTICS_SERVICE_URL || 'http://localhost:3002',
            'invoicing-service': process.env.INVOICING_SERVICE_URL || 'http://localhost:3003',
            'ai-service': process.env.AI_SERVICE_URL || 'http://localhost:8000',
            'sri-service': process.env.SRI_SERVICE_URL || 'http://localhost:9000',
        };
    }
};
exports.ServiceDiscoveryService = ServiceDiscoveryService;
exports.ServiceDiscoveryService = ServiceDiscoveryService = ServiceDiscoveryService_1 = __decorate([
    (0, common_1.Injectable)()
], ServiceDiscoveryService);
//# sourceMappingURL=service-discovery.service.js.map