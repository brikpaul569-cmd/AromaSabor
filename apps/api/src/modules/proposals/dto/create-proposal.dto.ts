import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsArray, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProposalItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  categoryLabel!: string;

  @IsNumber()
  @Min(0)
  pricePerPortion!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  portionGrams?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateProposalDto {
  @IsMongoId()
  menuId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  items!: CreateProposalItemDto[];

  @IsString()
  @IsNotEmpty()
  clientName!: string;

  @IsString()
  @IsNotEmpty()
  eventDate!: string;

  @IsNumber()
  @Min(1)
  guestCount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
