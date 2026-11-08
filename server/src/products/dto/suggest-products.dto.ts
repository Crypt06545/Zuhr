import { IsString, MaxLength, MinLength } from 'class-validator';

export class SuggestProductsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  q!: string;
}
