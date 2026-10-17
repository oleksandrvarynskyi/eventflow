import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'eventflow-api',
      timestamp: new Date().toISOString(),
    };
  }
}
