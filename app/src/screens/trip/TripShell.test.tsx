import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TripShell from './TripShell'

it('renders the five trip sub-nav links', () => {
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/trip/t1/plan']}>
        <Routes>
          <Route path="/trip/:id" element={<TripShell />}>
            <Route path="plan" element={<div>plan</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  for (const label of ['План', 'Расходы', 'Фото', 'Участники', 'Итоги']) {
    expect(screen.getByText(label)).toBeTruthy()
  }
})
