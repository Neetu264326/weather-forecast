import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import ErrorMessage from '../components/ErrorMessage'

describe('ErrorMessage', () => {
  test('picks title and icon for the error type', () => {
    render(<ErrorMessage type="notfound" message="No such place" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('City not found')).toBeInTheDocument()
    expect(screen.getByText('No such place')).toBeInTheDocument()
  })

  test('validation and limit types get their own copy', () => {
    const { unmount } = render(<ErrorMessage type="validation" />)
    expect(screen.getByText('Check your search')).toBeInTheDocument()
    unmount()

    render(<ErrorMessage type="limit" message="Too many requests" />)
    expect(screen.getByText('Slow down a little')).toBeInTheDocument()
    expect(screen.getByText('Too many requests')).toBeInTheDocument()
  })

  test('unknown type falls back to a generic state', () => {
    render(<ErrorMessage type="weird-thing" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  test('renders a retry button only when onRetry is provided', async () => {
    const onRetry = vi.fn()
    const { rerender } = render(<ErrorMessage type="api" onRetry={onRetry} />)
    const button = screen.getByRole('button', { name: /try again/i })
    await userEvent.click(button)
    expect(onRetry).toHaveBeenCalledTimes(1)

    rerender(<ErrorMessage type="api" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
