import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsObject,
  Min,
  Max,
  Length,
  IsEnum,
} from 'class-validator';
import { RuleTransactionType } from '../../common/enums';

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  description: string;

  @IsEnum(RuleTransactionType)
  @IsNotEmpty()
  type: RuleTransactionType;

  @IsObject()
  @IsNotEmpty()
  conditions: any; // JSON rules engine conditions object

  @IsObject()
  @IsNotEmpty()
  event: any; // JSON rules engine event object

  @IsNumber()
  @Min(1)
  @Max(100)
  priority: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isTest?: boolean = false;
}