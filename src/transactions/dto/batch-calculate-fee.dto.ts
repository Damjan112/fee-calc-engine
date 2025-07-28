import { Type } from 'class-transformer';
import { ValidateNested, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { CalculateFeeDto } from './calculate-fee.dto';

export class BatchCalculateFeeDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000) // Limit batch size for performance
  @ValidateNested({ each: true })
  @Type(() => CalculateFeeDto)
  transactions: CalculateFeeDto[];
}