import { Injectable } from '@nestjs/common';
import { Prisma, SponsoredTransaction, SponsoredTransactionStatus } from '@prisma/client';
import { PrismaService } from '@monorepo/common/database/prisma.service';

@Injectable()
export class SponsoredTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SponsoredTransactionCreateInput) {
    const result = await this.prisma.sponsoredTransaction.create({
      data,
    });

    return result.id;
  }

  async get(id: string) {
    return await this.prisma.sponsoredTransaction.findUnique({
      where: { id },
    });
  }

  findPending(page: number = 0, take: number = 10): Promise<SponsoredTransaction[] | null> {
    // Prevent frequent retries of transactions
    const lastUpdated = new Date(new Date().getTime() - 8_000);

    return this.prisma.sponsoredTransaction.findMany({
      where: {
        status: {
          notIn: [SponsoredTransactionStatus.SUCCESS, SponsoredTransactionStatus.FAILED],
        },
        updatedAt: {
          lt: lastUpdated,
        },
      },
      orderBy: [
        { retry: 'asc' }, // new entries have priority over older ones
        { createdAt: 'asc' },
      ],
      skip: page * take,
      take,
    });
  }

  async update(data: SponsoredTransaction) {
    await this.prisma.sponsoredTransaction.update({
      where: {
        id: data.id,
      },
      data: data,
    });
  }

  async updateManyPartial(entries: SponsoredTransaction[]) {
    await this.prisma.$transaction(
      entries.map((data) => {
        return this.prisma.sponsoredTransaction.update({
          where: {
            id: data.id,
          },
          data: {
            status: data.status,
            stxTransactionHash: data.stxTransactionHash,
            sponsoredTransactionHash: data.sponsoredTransactionHash,
            retry: data.retry,
          },
        });
      }),
    );
  }
}
