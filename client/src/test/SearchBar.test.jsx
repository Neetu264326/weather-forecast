import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import SearchBar from '../components/SearchBar'

describe('SearchBar', () => {
  test('submits valid queries', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} recent={[]} onClearRecent={() => {}} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'Bengaluru' } })
    fireEvent.submit(input.closest('form'))

    expect(onSearch).toHaveBeenCalledWith('Bengaluru')
  })

  test('rejects queries shorter than 2 characters', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} recent={[]} onClearRecent={() => {}} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'B' } })
    fireEvent.submit(input.closest('form'))

    expect(onSearch).not.toHaveBeenCalled()
  })

  test('trims whitespace before searching', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} recent={[]} onClearRecent={() => {}} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: '  Tokyo  ' } })
    fireEvent.submit(input.closest('form'))

    expect(onSearch).toHaveBeenCalledWith('Tokyo')
  })

  test('shows recent searches when focused with a value', () => {
    render(
      <SearchBar
        onSearch={() => {}}
        recent={['Oslo', 'Cairo']}
        onClearRecent={() => {}}
      />,
    )
    const input = screen.getByRole('searchbox')
    fireEvent.focus(input)
    expect(screen.getByText('Recent searches')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Oslo/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Cairo/ })).toBeInTheDocument()
  })
})
