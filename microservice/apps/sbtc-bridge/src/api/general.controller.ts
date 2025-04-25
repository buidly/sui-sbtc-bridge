import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { GeneralService } from './services/general.service';

@ApiTags('general')
@Controller('/general')
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  @Get('/sui/btc-coins')
  async getSuiBtcCoins() {
    return await this.generalService.getSuiBtcCoins();
  }
}
