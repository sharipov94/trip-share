import { IsIn, IsISO8601, IsNumber, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator'

export class CreateActivityDto {
  @IsString() @MaxLength(255)
  title: string

  @IsOptional() @IsString()
  description?: string

  @IsOptional() @IsString()
  activityUrl?: string

  @IsOptional() @IsNumber() @Min(0)
  price?: number

  @IsOptional() @IsString() @Length(3, 3)
  currency?: string

  @IsOptional() @IsISO8601()
  startTime?: string

  @IsOptional() @IsISO8601()
  endTime?: string
}

export class UpdateActivityDto {
  @IsOptional() @IsString() @MaxLength(255)
  title?: string

  @IsOptional() @IsString()
  description?: string

  @IsOptional() @IsString()
  activityUrl?: string

  @IsOptional() @IsNumber() @Min(0)
  price?: number

  @IsOptional() @IsString() @Length(3, 3)
  currency?: string

  @IsOptional() @IsISO8601()
  startTime?: string

  @IsOptional() @IsISO8601()
  endTime?: string
}

export class VoteDto {
  @IsIn(['going', 'not_going'])
  vote: 'going' | 'not_going'
}

export class CommentDto {
  @IsString() @MaxLength(1000)
  body: string
}
