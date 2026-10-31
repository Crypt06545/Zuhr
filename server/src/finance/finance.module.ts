// src/finance/finance.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema.js';
import { Order, OrderSchema } from '../orders/schemas/order.schema.js';
import { UsersModule } from '../users/users.module.js';
import { FinanceController } from './finance.controller.js';
import { FinanceService } from './finance.service.js';

@Module({
  imports: [
    // Read-only use: the report only reads orders and expenses
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Expense.name, schema: ExpenseSchema },
    ]),
    UsersModule, // RolesGuard needs UsersService
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
