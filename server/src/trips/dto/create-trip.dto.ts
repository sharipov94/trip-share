import { IsIn, IsISO8601, IsOptional, IsString, Length, MaxLength } from 'class-validator'

export class CreateTripDto {
  @IsString() @MaxLength(255)
  title: string

  @IsOptional() @IsString()
  description?: string

  @IsOptional() @IsIn(['flight', 'car', 'train', 'bus', 'other'])
  tripType?: string

  @IsString() @Length(3, 3)
  baseCurrency: string

  @IsOptional() @IsISO8601()
  startDate?: string

  @IsOptional() @IsISO8601()
  endDate?: string
}
