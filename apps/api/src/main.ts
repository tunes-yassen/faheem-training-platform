import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Security headers
  app.use(helmet());

  // Strict CORS
  const rawOrigins = config.get<string>('CORS_ORIGINS') || 'http://localhost:3000,http://localhost:3001,http://localhost:8081';
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-faheem-signature'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Strict input validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger OpenAPI docs at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Faheem Training Platform API — منصة فهيم للتدريب')
    .setDescription('Modular Monolith REST API for LMS, Academic Tutoring, Finance Ledger & Admin Governance')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(config.get('PORT') || 4000);
  await app.listen(port);
  console.log(`Faheem API running on http://localhost:${port}/api/v1 (Swagger: /api/docs)`);
}

bootstrap();
