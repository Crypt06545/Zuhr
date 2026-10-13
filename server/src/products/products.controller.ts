import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ImagesUpload } from '../common/multer/multer.options.js';
import { UserType } from '../users/schemas/user.schema.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import {
  ObjectIdParamDto,
  ProductVariantParamDto,
} from './dto/object-id-param.dto.js';
import {
  AdminQueryProductsDto,
  QueryProductsDto,
} from './dto/query-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';
import { MAX_PRODUCT_IMAGES } from './products.constants.js';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ───────── Public ─────────

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  // ───────── Admin only (401 token na thakle, 403 admin na hole) ─────────
  // Static routes must stay above ':slug'.

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Get('admin/list')
  findAllAdmin(@Query() query: AdminQueryProductsDto) {
    return this.productsService.findAllAdmin(query);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Get('admin/stock-summary')
  getStockSummary() {
    return this.productsService.getStockSummary();
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Get('admin/:id')
  findOneAdmin(@Param() { id }: ObjectIdParamDto) {
    return this.productsService.findOneAdmin(id);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Post()
  @UseInterceptors(ImagesUpload('images', MAX_PRODUCT_IMAGES))
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.create(dto, files ?? []);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Patch(':id/variants/:variantId/stock')
  updateStock(
    @Param() { id, variantId }: ProductVariantParamDto,
    @Body() dto: UpdateStockDto,
  ) {
    return this.productsService.updateStock(id, variantId, dto);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Patch(':id')
  @UseInterceptors(ImagesUpload('images', MAX_PRODUCT_IMAGES))
  update(
    @Param() { id }: ObjectIdParamDto,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.update(id, dto, files ?? []);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @Delete(':id')
  remove(@Param() { id }: ObjectIdParamDto) {
    return this.productsService.remove(id);
  }

  // ───────── Public (must stay last, otherwise 'admin/...' is read as a slug) ─────────

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
