import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as process from 'node:process';
import { SbtcBridgeModule } from './sbtc-bridge.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(SbtcBridgeModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors(); // TODO: Add cors using env vars
  app.set('trust proxy', 1);

  if (process.env?.NODE_ENV === 'development') {
    const config = new DocumentBuilder().setTitle('sui-sbtc-bridge-microservice').setVersion('1.0').build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('', app, document);
  }

  await app.listen(3000);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
