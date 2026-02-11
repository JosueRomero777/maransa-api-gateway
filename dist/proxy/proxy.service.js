"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProxyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const service_discovery_service_1 = require("../service-discovery/service-discovery.service");
let ProxyService = ProxyService_1 = class ProxyService {
    constructor(httpService, serviceDiscovery) {
        this.httpService = httpService;
        this.serviceDiscovery = serviceDiscovery;
        this.logger = new common_1.Logger(ProxyService_1.name);
    }
    async forwardRequest(serviceName, path, method, body, headers, query, req) {
        try {
            const baseUrl = await this.serviceDiscovery.getServiceUrl(serviceName);
            const url = `${baseUrl}${path}`;
            this.logger.debug(`Forwarding ${method} ${url}`);
            const acceptHeader = headers['accept'] || '';
            const isPdfRequest = path.endsWith('/pdf') || acceptHeader.includes('application/pdf');
            const config = {
                method: method.toLowerCase(),
                url,
                headers: {
                    ...headers,
                    'X-Forwarded-For': headers['x-forwarded-for'] || 'api-gateway',
                    'X-Gateway': 'maransa-api-gateway',
                },
                params: query,
                timeout: 30000,
                responseType: isPdfRequest ? 'arraybuffer' : 'json',
                validateStatus: (status) => {
                    return status >= 200 && status < 400;
                },
            };
            const contentType = headers['content-type'] || '';
            if (contentType.includes('multipart/form-data') && req) {
                config.data = req;
            }
            else if (['post', 'put', 'patch'].includes(method.toLowerCase()) && body) {
                config.data = body;
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.request(config));
            return {
                data: response.data,
                status: response.status,
                headers: response.headers,
                isBinary: isPdfRequest,
            };
        }
        catch (error) {
            this.logger.error(`Error forwarding request to ${serviceName}: ${error.message}`);
            if (error.response) {
                throw new common_1.HttpException(error.response.data || error.message, error.response.status);
            }
            throw new common_1.HttpException(`Service ${serviceName} unavailable`, 503);
        }
    }
    getServiceNameFromRoute(route) {
        if (route.startsWith('/api/ai/')) {
            if (route.startsWith('/api/ai/predictions/') ||
                route.startsWith('/api/ai/statistics/') ||
                route.startsWith('/api/ai/predict/')) {
                return process.env.BACKEND_MONOLITH_URL ? 'backend-monolith' : 'ai-backend-service';
            }
            return 'ai-service';
        }
        if (route.startsWith('/api/sri'))
            return 'sri-service';
        const useMonolith = !!process.env.BACKEND_MONOLITH_URL;
        if (useMonolith) {
            return 'backend-monolith';
        }
        else {
            if (route.startsWith('/api/auth'))
                return 'auth-service';
            if (route.startsWith('/api/users'))
                return 'auth-service';
            if (route.startsWith('/api/orders'))
                return 'orders-service';
            if (route.startsWith('/api/providers'))
                return 'orders-service';
            if (route.startsWith('/api/packagers'))
                return 'orders-service';
            if (route.startsWith('/api/receptions'))
                return 'orders-service';
            if (route.startsWith('/api/laboratory'))
                return 'orders-service';
            if (route.startsWith('/api/harvest'))
                return 'orders-service';
            if (route.startsWith('/api/logistics'))
                return 'logistics-service';
            if (route.startsWith('/api/custody'))
                return 'logistics-service';
            if (route.startsWith('/api/invoicing'))
                return 'invoicing-service';
            return 'auth-service';
        }
    }
    transformPath(originalPath, serviceName) {
        if (serviceName === 'backend-monolith') {
            return originalPath.replace('/api', '');
        }
        if (serviceName === 'ai-service') {
            return originalPath.replace('/api/ai', '');
        }
        if (serviceName === 'sri-service') {
            return originalPath.replace('/api/sri', '');
        }
        if (serviceName.includes('service') && originalPath.startsWith('/api/')) {
            return originalPath.replace('/api', '');
        }
        return originalPath;
    }
};
exports.ProxyService = ProxyService;
exports.ProxyService = ProxyService = ProxyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        service_discovery_service_1.ServiceDiscoveryService])
], ProxyService);
//# sourceMappingURL=proxy.service.js.map