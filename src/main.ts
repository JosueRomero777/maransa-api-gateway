import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as Consul from 'consul';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Maransa API Gateway')
    .setDescription(
      'API Gateway centralizado para arquitectura de microservicios Maransa',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación y autorización')
    .addTag('orders', 'Gestión de pedidos')
    .addTag('logistics', 'Logística y transporte')
    .addTag('invoicing', 'Facturación electrónica')
    .addTag('ai', 'Inteligencia Artificial y predicciones')
    .addTag('health', 'Health checks')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8080;
  await app.listen(port);

  // Service Registry with Consul
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

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await consul.agent.service.deregister(serviceId);
        console.log('Service deregistered from Consul');
        process.exit(0);
      });
    } catch (error) {
      console.warn('⚠️  Consul not available, continuing without service discovery');
    }
  }

  console.log(`🚀 API Gateway running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
