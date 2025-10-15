import { ApiEnv, PREFIX } from '@clientfuse/models';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import { json } from 'express';
import { AppModule } from './app/app.module';
import { TransformResponse } from './app/core/interceptors/transform-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const prefix = PREFIX;
  app.setGlobalPrefix(prefix);

  // Configure raw body for Stripe webhook signature verification
  // This must be done before other middleware
  app.use(json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: [configService.get(ApiEnv.CORS_ORIGIN)],
    credentials: true
  });

  app.useGlobalInterceptors(new TransformResponse());

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: {
      enableImplicitConversion: false
    }
  }));

  const port = +process.env[ApiEnv.PORT] || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${prefix}`
  );
}

bootstrap();
