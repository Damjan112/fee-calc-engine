import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  Length,
  IsEnum,
} from 'class-validator';
import { ClientSegment } from '../../common/enums';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsNumber()
  @Min(0)
  @Max(1000)
  creditScore: number;

  @IsOptional()
  @IsEnum(ClientSegment)
  segment?: ClientSegment;

  @IsOptional()
  @IsEmail()
  @Length(5, 100)
  email?: string;
}
