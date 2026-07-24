import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { DbModule } from './db/db.module';

@Module({
	imports: [
    DbModule,
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		AuthModule,
		ReportsModule,
		TransactionsModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
