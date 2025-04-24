import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SponsoredService } from './sponsored.service';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('general')
@Controller('/sponsored-transactions')
export class SponsoredController {
  constructor(private readonly sponsoredService: SponsoredService) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 120_000 } })
  @Post('/send')
  async sendSponsoredTransaction(@Body('rawTransaction') rawTransaction: string) {
    const sponsoredTransactionId = await this.sponsoredService.saveSponsoredTransaction(rawTransaction);

    return {
      sponsoredTransactionId,
    };
  }

  @UseGuards(ThrottlerGuard)
  @Get('/:id')
  async getSponsoredTransaction(@Param('id') id: string) {
    return await this.sponsoredService.getSponsoredTransaction(id);
  }
}
