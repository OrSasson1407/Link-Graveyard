import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { LinksModule } from '../links/links.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [LinksModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, PrismaService],
})
export class WebhooksModule {}
