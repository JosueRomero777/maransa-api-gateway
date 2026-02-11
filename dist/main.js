"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const helmet_1 = require("helmet");
const Consul = require("consul");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Maransa API Gateway')
        .setDescription('API Gateway centralizado para arquitectura de microservicios Maransa')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Autenticación y autorización')
        .addTag('orders', 'Gestión de pedidos')
        .addTag('logistics', 'Logística y transporte')
        .addTag('invoicing', 'Facturación electrónica')
        .addTag('ai', 'Inteligencia Artificial y predicciones')
        .addTag('health', 'Health checks')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 8080;
    await app.listen(port);
    if (process.env.CONSUL_HOST) {
        try {
            const consul = new Consul({
                host: process.env.CONSUL_HOST || 'localhost',
                port: process.env.CONSUL_PORT || '8500',
            });
            const serviceId = process.env.SERVICE_ID || 'api-gateway-1';
            const serviceName = process.env.SERVICE_NAME || 'api-gateway';
            await consul.agent.service.register({
                id: serviceId,
                name: serviceName,
                address: 'localhost',
                port: Number(port),
                check: {
                    http: `http://localhost:${port}/health`,
                    interval: '10s',
                    timeout: '5s',
                },
            });
            console.log(`✅ Service registered in Consul: ${serviceName} (${serviceId})`);
            process.on('SIGINT', async () => {
                await consul.agent.service.deregister(serviceId);
                console.log('Service deregistered from Consul');
                process.exit(0);
            });
        }
        catch (error) {
            console.warn('⚠️  Consul not available, continuing without service discovery');
        }
    }
    console.log(`🚀 API Gateway running on: http://localhost:${port}`);
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map