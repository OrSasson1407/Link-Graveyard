import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  await app.listen(3001);
  console.log('API Gateway running on http://localhost:3001');
}
bootstrap();
