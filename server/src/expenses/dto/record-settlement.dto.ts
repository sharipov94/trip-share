import { IsNumber, IsPositive, IsUUID } from 'class-validator'

export class RecordSettlementDto {
  @IsUUID()
  fromUser: string

  @IsUUID()
  toUser: string

  @IsNumber() @IsPositive()
  amount: number
}
