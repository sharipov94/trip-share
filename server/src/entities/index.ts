import { User } from './user.entity'
import { Trip } from './trip.entity'
import { TripMember } from './trip-member.entity'
import { Activity } from './activity.entity'
import { ActivityVote } from './activity-vote.entity'
import { Expense } from './expense.entity'
import { ExpenseParticipant } from './expense-participant.entity'
import { Settlement } from './settlement.entity'
import { Memory } from './memory.entity'
import { ActivityComment } from './activity-comment.entity'
import { BingoMark } from './bingo-mark.entity'

export const entities = [
  User, Trip, TripMember, Activity, ActivityVote, Expense, ExpenseParticipant, Settlement, Memory, ActivityComment, BingoMark,
]

export {
  User, Trip, TripMember, Activity, ActivityVote, Expense, ExpenseParticipant, Settlement, Memory, ActivityComment, BingoMark,
}
