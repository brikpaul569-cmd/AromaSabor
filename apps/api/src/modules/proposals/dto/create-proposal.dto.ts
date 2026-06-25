import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsArray, ValidateNested, IsMongoId, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProposalItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsIn(['entrada', 'plato_fuerte', 'guarnicion', 'postre'])
  category!: string;

  @IsNumber()
  @Min(0)
  price!: number;

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
