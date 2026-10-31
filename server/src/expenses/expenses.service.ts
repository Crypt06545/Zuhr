// src/expenses/expenses.service.ts

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  type PopulateOptions,
  type QueryFilter as FilterQuery,
  Model,
  Types,
} from 'mongoose';

import { RedisService } from '../common/redis/redis.service.js';
import { DEFAULT_PAGE_LIMIT } from '../products/products.constants.js';
import type { CreateExpenseDto } from './dto/create-expense.dto.js';
import type { QueryExpensesDto } from './dto/query-expenses.dto.js';
import type { UpdateExpenseDto } from './dto/update-expense.dto.js';
import type { VoidExpenseDto } from './dto/void-expense.dto.js';
import { EXPENSES_VERSION_KEY } from './expenses.constants.js';
import {
  Expense,
  type ExpenseDocument,
  ExpenseStatus,
} from './schemas/expense.schema.js';

type ExpenseLean = Expense & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export interface ExpenseListResult {
  items: unknown[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Bangladesh is UTC+6 with no daylight saving
const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// "2026-10-31" -> 00:00 of that day in Bangladesh. Rejects dates that do not exist.
const bdDayStart = (value: string): Date => {
  const date = new Date(`${value}T00:00:00+06:00`);
  const roundTrip = Number.isNaN(date.getTime())
    ? ''
    : new Date(date.getTime() + BD_OFFSET_MS).toISOString().slice(0, 10);

  if (roundTrip !== value) {
    throw new BadRequestException(`Invalid date: ${value}`);
  }

  return date;
};

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

// Names only: no email, no password hash
const WHO: PopulateOptions[] = [
  { path: 'createdBy', model: 'User', select: 'name' },
  { path: 'updatedBy', model: 'User', select: 'name' },
  { path: 'voidedBy', model: 'User', select: 'name' },
];

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
    private readonly redis: RedisService,
  ) {}

  async create(dto: CreateExpenseDto, actorId: string) {
    const created = await this.expenseModel.create({
      title: dto.title,
      category: dto.category,
      amount: roundMoney(dto.amount),
      expenseDate: bdDayStart(dto.expenseDate),
      note: dto.note,
      createdBy: new Types.ObjectId(actorId),
    });

    await this.bumpVersion();

    return created.toObject();
  }

  async findAll(query: QueryExpensesDto): Promise<ExpenseListResult> {
    const limit = query.limit ?? DEFAULT_PAGE_LIMIT;
    const filter: FilterQuery<ExpenseDocument> = {};

    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;

    const range: { $gte?: Date; $lt?: Date } = {};

    if (query.dateFrom) range.$gte = bdDayStart(query.dateFrom);
    // date only = the whole Bangladesh day
    if (query.dateTo)
      range.$lt = new Date(bdDayStart(query.dateTo).getTime() + DAY_MS);

    if (range.$gte && range.$lt && range.$gte >= range.$lt) {
      throw new BadRequestException('dateFrom must not be after dateTo');
    }

    if (range.$gte || range.$lt) filter.expenseDate = range;

    // Cursor = "<expenseDate in ms>_<id>", because the list is sorted by expense date
    if (query.cursor) {
      const [rawMs, rawId] = query.cursor.split('_');
      const ms = Number(rawMs);

      if (
        !rawMs ||
        !Number.isFinite(ms) ||
        !rawId ||
        !Types.ObjectId.isValid(rawId)
      ) {
        throw new BadRequestException('Invalid cursor');
      }

      const date = new Date(ms);
      const id = new Types.ObjectId(rawId);

      filter.$and = [
        {
          $or: [
            { expenseDate: { $lt: date } },
            { expenseDate: date, _id: { $lt: id } },
          ],
        },
      ];
    }

    // limit + 1: one extra document tells us there is another page (no count query)
    const docs = await this.expenseModel
      .find(filter)
      .sort({ expenseDate: -1, _id: -1 })
      .limit(limit + 1)
      .populate(WHO)
      .lean<ExpenseLean[]>()
      .exec();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const last = items[items.length - 1];

    return {
      items,
      nextCursor:
        hasMore && last
          ? `${last.expenseDate.getTime()}_${String(last._id)}`
          : null,
      hasMore,
    };
  }

  async findOne(id: string): Promise<ExpenseLean> {
    const expense = await this.expenseModel
      .findById(id)
      .populate(WHO)
      .lean<ExpenseLean>()
      .exec();

    if (!expense) throw new NotFoundException('Expense not found');

    return expense;
  }

  // Only an active expense can be edited. A voided one stays as it was.
  async update(id: string, dto: UpdateExpenseDto, actorId: string) {
    const set: Record<string, unknown> = {};

    if (dto.title !== undefined) set.title = dto.title;
    if (dto.category !== undefined) set.category = dto.category;
    if (dto.amount !== undefined) set.amount = roundMoney(dto.amount);
    if (dto.expenseDate !== undefined) {
      set.expenseDate = bdDayStart(dto.expenseDate);
    }
    if (dto.note !== undefined) set.note = dto.note;

    if (!Object.keys(set).length) {
      throw new BadRequestException('Nothing to update');
    }

    set.updatedBy = new Types.ObjectId(actorId);

    const filter: Record<string, unknown> = {
      _id: new Types.ObjectId(id),
      status: ExpenseStatus.ACTIVE,
    };

    if (dto.expectedUpdatedAt) {
      filter.updatedAt = new Date(dto.expectedUpdatedAt);
    }

    const updated = await this.expenseModel
      .findOneAndUpdate(filter, { $set: set }, { returnDocument: 'after' })
      .lean<ExpenseLean>()
      .exec();

    if (!updated) {
      await this.explainFailure(id);
    }

    await this.bumpVersion();

    return updated;
  }

  // The only way to remove an expense from the books. The row stays forever.
  async void(id: string, dto: VoidExpenseDto, actorId: string) {
    const voided = await this.expenseModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), status: ExpenseStatus.ACTIVE },
        {
          $set: {
            status: ExpenseStatus.VOIDED,
            voidedAt: new Date(),
            voidedBy: new Types.ObjectId(actorId),
            voidReason: dto.reason,
          },
        },
        { returnDocument: 'after' },
      )
      .lean<ExpenseLean>()
      .exec();

    if (!voided) {
      await this.explainFailure(id);
    }

    await this.bumpVersion();

    return voided;
  }

  // ───────────────────────── Internals ─────────────────────────

  // An update or void matched nothing: say why (always throws)
  private async explainFailure(id: string): Promise<never> {
    const current = await this.expenseModel
      .findById(id)
      .select('status')
      .lean<Pick<ExpenseLean, 'status'>>()
      .exec();

    if (!current) throw new NotFoundException('Expense not found');

    if (current.status === ExpenseStatus.VOIDED) {
      throw new ConflictException('This expense is already voided');
    }

    throw new ConflictException(
      'This expense was changed by someone else. Reload and try again',
    );
  }

  // Old cached finance reports become unreachable (same idea as the orders summary)
  private async bumpVersion(): Promise<void> {
    await this.redis.incr(EXPENSES_VERSION_KEY);
  }
}
