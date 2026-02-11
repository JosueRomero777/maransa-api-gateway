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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const proxy_service_1 = require("./proxy.service");
const auth_guard_1 = require("../auth/auth.guard");
let ProxyController = class ProxyController {
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    async publicAuth(req, res) {
        return this.forwardToService(req, res);
    }
    async externalServices(req, res) {
        return this.forwardToService(req, res);
    }
    async proxy(req, res) {
        return this.forwardToService(req, res);
    }
    async forwardToService(req, res) {
        try {
            const originalPath = req.path;
            const serviceName = this.proxyService.getServiceNameFromRoute(originalPath);
            const targetPath = this.proxyService.transformPath(originalPath, serviceName);
            const headers = { ...req.headers };
            delete headers.host;
            delete headers.connection;
            const contentType = headers['content-type'] || '';
            if (!contentType.includes('multipart/form-data')) {
                delete headers['content-length'];
            }
            const result = await this.proxyService.forwardRequest(serviceName, targetPath, req.method, req.body, headers, req.query, contentType.includes('multipart/form-data') ? req : undefined);
            if (result.isBinary) {
                if (result.headers) {
                    const contentType = result.headers['content-type'];
                    const contentDisposition = result.headers['content-disposition'];
                    if (contentType)
                        res.setHeader('Content-Type', contentType);
                    if (contentDisposition)
                        res.setHeader('Content-Disposition', contentDisposition);
                }
                const buffer = Buffer.isBuffer(result.data)
                    ? result.data
                    : Buffer.from(result.data);
                res.status(result.status).send(buffer);
                return;
            }
            res.status(result.status).json(result.data);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                res.status(error.getStatus()).json(error.getResponse());
            }
            else {
                res.status(500).json({
                    statusCode: 500,
                    message: 'Internal gateway error',
                    error: error.message,
                });
            }
        }
    }
};
exports.ProxyController = ProxyController;
__decorate([
    (0, common_1.All)(['auth/login', 'auth/register', 'auth/check-email']),
    (0, swagger_1.ApiOperation)({ summary: 'Public authentication endpoints' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "publicAuth", null);
__decorate([
    (0, common_1.All)(['ai/predict/*', 'ai/data/*', 'ai/models/*', 'ai/health', 'ai/analysis/*', 'sri/*']),
    (0, swagger_1.ApiOperation)({ summary: 'Public AI and SRI service endpoints' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "externalServices", null);
__decorate([
    (0, common_1.All)('*'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Forward request to appropriate microservice' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "proxy", null);
exports.ProxyController = ProxyController = __decorate([
    (0, swagger_1.ApiTags)('proxy'),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], ProxyController);
//# sourceMappingURL=proxy.controller.js.map