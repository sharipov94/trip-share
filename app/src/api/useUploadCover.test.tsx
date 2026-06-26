import { it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { trips } from './trips'
import { useUploadCover, qk } from './queries'
import type { Trip } from '../types'

afterEach(() => vi.restoreAllMocks())

const seedTrip: Trip = {
  id: 't1', title: 'T', dates: '', status: 'active', cls: '', currency: '€', members: [],
}

it('writes the returned coverUrl into the trip cache (and does not wipe it)', async () => {
  vi.spyOn(trips, 'uploadCover').mockResolvedValue({ coverUrl: '/uploads/x.jpg' })
  const qc = new QueryClient()
  qc.setQueryData(qk.trip('t1'), seedTrip)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useUploadCover('t1'), { wrapper })

  result.current.mutate(new File([], 'a.jpg'))

  await waitFor(() =>
    expect((qc.getQueryData(qk.trip('t1')) as Trip | undefined)?.coverUrl).toBe('/uploads/x.jpg'),
  )
})
