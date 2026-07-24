import { Controller, Get } from '@nestjs/common';

@Controller('transactions')
export class TransactionsController {
  @Get('/')
  getTransactions() {
    return { message: 'Transactions endpoint' };
  }
}
