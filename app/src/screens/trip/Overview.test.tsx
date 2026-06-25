import { it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import * as q from '../../api/queries'
import Overview from './Overview'

afterEach(() => vi.restoreAllMocks())

it('lists every balance involving me (not just one)', () => {
  vi.spyOn(q, 'useTrip').mockReturnValue({ data: { id: 't1', title: 'T', members: [], cls: '', currency: '€', dates: '', status: 'active' } } as any)
  vi.spyOn(q, 'useActivities').mockReturnValue({ data: [] } as any)
  vi.spyOn(q, 'useExpenses').mockReturnValue({ data: [] } as any)
  vi.spyOn(q, 'useMemories').mockReturnValue({ data: [] } as any)
  vi.spyOn(q, 'useBalance').mockReturnValue({ data: [
    { from: 'Ты', to: 'Аня', amount: 42 },
    { from: 'Боб', to: 'Ты', amount: 10 },
  ] } as any)
  render(
    <MemoryRouter initialEntries={['/trip/t1/overview']}>
      <Routes><Route path="/trip/:id/overview" element={<Overview />} /></Routes>
    </MemoryRouter>,
  )
  expect(screen.getByText('Аня')).toBeTruthy()
  expect(screen.getByText('Боб')).toBeTruthy()
})
