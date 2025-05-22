import { Module } from '@nestjs/common';
import { PrismaService } from '@monorepo/common/database/prisma.service';
import { SponsoredTransactionRepository } from '@monorepo/common/database/repository/sponsored-transaction.repository';

@Module({
  providers: [PrismaService, SponsoredTransactionRepository],
  exports: [SponsoredTransactionRepository],
})
export class DatabaseModule {}
