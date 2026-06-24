import { IsArray, IsIn, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator'

export class CreateExpenseDto {
  @IsNumber() @Min(0)
  amount: number

  @IsString() @Length(3, 3)
  currency: string

  @IsOptional() @IsIn([
    'activity', 'restaurant', 'transport', 'fuel', 'parking', 'toll',
    'accommodation', 'shopping', 'other',
  ])
  category?: string

  @IsOptional() @IsString()
  title?: string

  @IsOptional() @IsIn(['equal', 'passengers_only', 'manual'])
  splitMode?: string

  // если не задано — делим на всех участников поездки
  @IsOptional() @IsArray() @IsUUID('all', { each: true })
  participantIds?: string[]
}
