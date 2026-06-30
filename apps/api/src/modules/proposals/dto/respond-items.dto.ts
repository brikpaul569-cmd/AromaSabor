import { IsArray, IsIn, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ItemResponse {
  @IsString()
  _id!: string;

  @IsIn(['pendiente', 'aceptado', 'rechazado'])
  itemStatus!: string;
}

export class RespondItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemResponse)
  items!: ItemResponse[];
}
