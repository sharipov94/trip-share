import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from './nav'

it('shows only Поездки and Профиль, and no create FAB', () => {
  render(<MemoryRouter><BottomNav /></MemoryRouter>)
  expect(screen.getByText('Поездки')).toBeTruthy()
  expect(screen.getByText('Профиль')).toBeTruthy()
  expect(screen.queryByText('Сегодня')).toBeNull()
  expect(screen.queryByText('Финансы')).toBeNull()
  expect(screen.queryByLabelText('Создать')).toBeNull()
})
