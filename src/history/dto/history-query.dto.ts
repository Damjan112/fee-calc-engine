import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import {
  TransactionType,
  CalculationType,
  SortOrder,
  HistorySortField,
} from '../../common/enums';

export class HistoryQueryDto {
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(CalculationType)
  calculationType?: CalculationType;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsEnum(HistorySortField)
  sortBy?: HistorySortField = HistorySortField.CALCULATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
