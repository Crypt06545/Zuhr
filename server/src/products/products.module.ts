import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Category,
  CategorySchema,
} from '../categories/schemas/category.schema.js';
import { UsersModule } from '../users/users.module.js';
import { ProductsCache } from './products.cache.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { Product, ProductSchema } from './schemas/product.schema.js';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
    UsersModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsCache],
  exports: [ProductsService],
})
export class ProductsModule {}
