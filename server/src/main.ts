import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const mode =
    process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT';
  console.log(`🚀 Server running on port ${port} (${mode})`);
}
await bootstrap();
