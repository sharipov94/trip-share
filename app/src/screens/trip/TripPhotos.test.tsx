import { it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as q from '../../api/queries'
import TripPhotos from './TripPhotos'

afterEach(() => vi.restoreAllMocks())

it('switches between Лента and Бинго segments', () => {
  vi.spyOn(q, 'useMemories').mockReturnValue({ data: [] } as any)
  vi.spyOn(q, 'useBingo').mockReturnValue({ data: { completed: 0, total: 9, tasks: [] }, isLoading: false } as any)
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/trip/t1/photos']}>
        <Routes><Route path="/trip/:id/photos" element={<TripPhotos />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  expect(screen.getByText('Лента')).toBeTruthy()
  fireEvent.click(screen.getByText('Бинго'))
  expect(screen.getByText('Собрано')).toBeTruthy()
})
