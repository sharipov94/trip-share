import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateTripDto {
  @IsOptional() @IsString() @MaxLength(255)
  title?: string

  @IsOptional() @IsString()
  description?: string

  @IsOptional() @IsIn(['flight', 'car', 'train', 'bus', 'other'])
  tripType?: string

  @IsOptional() @IsIn(['planning', 'active', 'finished'])
  status?: string

  @IsOptional() @IsISO8601()
  startDate?: string

  @IsOptional() @IsISO8601()
  endDate?: string
}
