import { IsString, IsNotEmpty } from 'class-validator';

export class ClaimDto {
  @IsString()
  @IsNotEmpty()
  clientName!: string;
}
