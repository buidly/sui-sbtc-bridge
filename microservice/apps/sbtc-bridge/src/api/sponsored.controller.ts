import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { deserializeTransaction } from '@stacks/transactions';
import { SponsoredService } from './sponsored.service';

@ApiTags('general')
@Controller('/sponsored-transactions')
export class SponsoredController {
  constructor(private readonly sponsoredService: SponsoredService) {}

  @Post('/send')
  async sendSponsoredTransaction(@Body('rawTransaction') rawTransaction: string) {
    const transaction = deserializeTransaction(rawTransaction);

    try {
      transaction.verifyOrigin();
    } catch (e) {
      throw new BadRequestException('Invalid signed transaction');
    }

    // TODO: Get transaction and test that we support it (sender has 0 STX, is for ITS only for sBTC towards Sui etc)

    const txHash = await this.sponsoredService.sendSponsoredTransaction(transaction);

    return {
      txHash,
    };
  }
}
