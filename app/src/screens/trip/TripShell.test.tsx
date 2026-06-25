import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TripShell from './TripShell'

it('renders the four trip tab links', () => {
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/trip/t1/overview']}>
        <Routes>
          <Route path="/trip/:id" element={<TripShell />}>
            <Route path="overview" element={<div>ov</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  for (const label of ['Обзор', 'Расходы', 'Активности', 'Фото']) {
    expect(screen.getByText(label)).toBeTruthy()
  }
})
