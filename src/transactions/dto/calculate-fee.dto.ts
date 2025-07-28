import { Type } from 'class-transformer';
import { ValidateNested, IsNotEmpty } from 'class-validator';
import { CreateTransactionDto } from './create-transaction.dto';
import { CreateClientDto } from '../../clients/dto/create-client.dto';

export class CalculateFeeDto {
  @ValidateNested()
  @Type(() => CreateTransactionDto)
  @IsNotEmpty()
  transaction: CreateTransactionDto;

  @ValidateNested()
  @Type(() => CreateClientDto)
  @IsNotEmpty()
  client: CreateClientDto;
}
