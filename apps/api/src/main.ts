import { ApiEnv, PREFIX } from '@connectly/models';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { TransformResponse } from './app/interceptors/transform-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const prefix = PREFIX;
  app.setGlobalPrefix(prefix);

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: [configService.get(ApiEnv.CORS_ORIGIN)],
    credentials: true
  });

  app.useGlobalInterceptors(new TransformResponse());

  app.useGlobalPipes(new ValidationPipe({
    transform: true
  }));

  const port = +process.env[ApiEnv.PORT] || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${prefix}`
  );
}

bootstrap();
