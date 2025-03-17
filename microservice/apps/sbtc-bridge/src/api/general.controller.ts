import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';

@ApiTags('general')
@Controller('/general')
export class GeneralController {
  @Get('/')
  test(): string {
    return 'Hello World';
  }
}
