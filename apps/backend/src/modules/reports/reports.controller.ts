import { Controller, Get } from '@nestjs/common';

@Controller('reports')
export class ReportsController {
  @Get('/')
  getReports() {
    return { message: 'Reports endpoint' };
  }
}
