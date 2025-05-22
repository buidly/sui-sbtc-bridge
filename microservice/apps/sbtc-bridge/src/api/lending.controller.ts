import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { LendingService } from './services/lending.service';

@ApiTags('lending')
@Controller('/lending')
export class LendingController {
  constructor(private readonly lendingService: LendingService) {}

  @Get('/btc-pools')
  async getBtcPools() {
    return await this.lendingService.getBtcPools();
  }
}
