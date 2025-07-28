import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { TransactionType, Currency } from '../../common/enums';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1000000)
  amount: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency = Currency.EUR;

  @IsOptional()
  @IsString()
  @IsUUID()
  clientId?: string;
}
