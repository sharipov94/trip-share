import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trips } from './trips'
import { activities } from './activities'
import { expenses } from './expenses'
import { auth } from './auth'
import { memories } from './memories'
import { receipts } from './receipts'
import { bingo } from './bingo'
import { getCurrentTripId, setCurrentTripId } from '../lib/currentTrip'
import type { Trip } from '../types'

export const qk = {
  trips: ['trips'] as const,
  trip: (id: string) => ['trip', id] as const,
  balance: (id: string) => ['balance', id] as const,
  activities: (id: string) => ['activities', id] as const,
  expenses: (id: string) => ['expenses', id] as const,
  expense: (id: string) => ['expense', id] as const,
  memories: (id: string) => ['memories', id] as const,
}

/** id последней открытой поездки (или '' — экран должен увести на /trips). */
export function useCurrentTripId(): string {
  return getCurrentTripId() ?? ''
}

/** Сменить текущую поездку (вызывается при входе в поездку). */
export function useSetCurrentTrip() {
  const qc = useQueryClient()
  return (id: string) => {
    setCurrentTripId(id)
    qc.invalidateQueries({ queryKey: ['trip'] })
  }
}

/** Текущая поездка целиком (с участниками) — для расчёта деления. */
export function useCurrentTrip() {
  return useTrip(useCurrentTripId())
}

// обратная совместимость со старыми экранами (Home/Balance/Activity*/Invite…)
export const useActiveTripId = useCurrentTripId
export const useActiveTrip = useCurrentTrip

export const useTrips = () => useQuery({ queryKey: qk.trips, queryFn: trips.list })

export const useTrip = (id: string) =>
  useQuery({ queryKey: qk.trip(id), queryFn: () => trips.get(id), enabled: !!id })
export const useBalance = (id: string) =>
  useQuery({ queryKey: qk.balance(id), queryFn: () => trips.balance(id), enabled: !!id })
export const useSummary = (id: string) =>
  useQuery({ queryKey: ['summary', id], queryFn: () => trips.summary(id), enabled: !!id })
export const useActivities = (id: string) =>
  useQuery({ queryKey: qk.activities(id), queryFn: () => activities.list(id), enabled: !!id })
export const useExpenses = (id: string) =>
  useQuery({ queryKey: qk.expenses(id), queryFn: () => expenses.list(id), enabled: !!id })
export const useExpense = (id: string) =>
  useQuery({ queryKey: qk.expense(id), queryFn: () => expenses.get(id), enabled: !!id })
export const useActivity = (id: string) =>
  useQuery({ queryKey: ['activity', id], queryFn: () => activities.get(id), enabled: !!id })
export const useComments = (id: string) =>
  useQuery({ queryKey: ['comments', id], queryFn: () => activities.comments(id), enabled: !!id })

export function useAddComment(activityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => activities.addComment(activityId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', activityId] }),
  })
}

export function useVote(activityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vote: 'going' | 'not_going') => activities.vote(activityId, vote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity', activityId] })
      qc.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export function useCreateTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: { title: string; baseCurrency: string; tripType?: string; startDate?: string; endDate?: string }) =>
      trips.create(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.trips }),
  })
}

export function useInvite(tripId: string) {
  return useMutation({ mutationFn: () => trips.invite(tripId) })
}

export function useDeleteTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tripId: string) => trips.remove(tripId),
    onSuccess: (_d, tripId) => {
      // мгновенно убираем из кэша списка, затем синхронизируем с сервером
      qc.setQueryData<Trip[]>(qk.trips, (old) => old?.filter((t) => t.id !== tripId))
      qc.invalidateQueries({ queryKey: qk.trips })
    },
  })
}

export function useRecordSettlement(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { fromUser: string; toUser: string; amount: number }) =>
      trips.recordSettlement(tripId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.balance(tripId) })
      qc.invalidateQueries({ queryKey: qk.trips })
    },
  })
}

export function useUpdateTrip(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title?: string; status?: string; startDate?: string; endDate?: string; tripType?: string }) =>
      trips.update(tripId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.trip(tripId) })
      qc.invalidateQueries({ queryKey: qk.trips })
    },
  })
}

export function useCreateActivity(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: { title: string; startTime?: string; description?: string; activityUrl?: string; price?: number; currency?: string }) =>
      activities.create(tripId, b),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.activities(tripId) }),
  })
}

export function useCompleteActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (activityId: string) => activities.complete(activityId),
    onSuccess: (_d, activityId) => {
      qc.invalidateQueries({ queryKey: ['activity', activityId] })
      qc.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export function useUpdateActivity(activityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title?: string; description?: string; startTime?: string; price?: number }) =>
      activities.update(activityId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity', activityId] }),
  })
}

export function useUpdateTheme() {
  return useMutation({ mutationFn: (theme: string) => auth.updateTheme(theme) })
}

export const useMemories = (tripId: string) =>
  useQuery({ queryKey: qk.memories(tripId), queryFn: () => memories.list(tripId), enabled: !!tripId })

export function useReceiptOcr(tripId: string) {
  return useMutation({ mutationFn: (file: File) => receipts.ocr(tripId, file) })
}

export const useBingo = (tripId: string) =>
  useQuery({ queryKey: ['bingo', tripId], queryFn: () => bingo.list(tripId), enabled: !!tripId })

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { firstName?: string; paymentDetails?: string }) => auth.updateProfile(body),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useUploadMemory(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { file: File; phase?: string; activityId?: string }) =>
      memories.upload(tripId, v.file, { phase: v.phase, activityId: v.activityId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.memories(tripId) }),
  })
}

export function useCreateExpense(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: { amount: number; currency: string; category?: string; title?: string }) =>
      expenses.create(tripId, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.expenses(tripId) })
      qc.invalidateQueries({ queryKey: qk.balance(tripId) })
    },
  })
}
