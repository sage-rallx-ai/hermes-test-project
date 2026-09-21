import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(cleanup)

beforeEach(() => localStorage.clear())

describe('todo app', () => {
  it('adds a task and ignores empty input', () => {
    render(<App />)
    const input = screen.getByLabelText('Add a task')
    fireEvent.change(input, { target: { value: '  Write tests  ' } })
    fireEvent.submit(input.closest('form')!)
    expect(screen.getByText('Write tests')).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.submit(input.closest('form')!)
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('toggles and deletes tasks', () => {
    render(<App />)
    const input = screen.getByLabelText('Add a task')
    fireEvent.change(input, { target: { value: 'Ship it' } })
    fireEvent.submit(input.closest('form')!)
    fireEvent.click(screen.getByRole('button', { name: 'Complete Ship it' }))
    expect(screen.getByRole('button', { name: 'Mark Ship it active' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Delete Ship it' }))
    expect(screen.queryByText('Ship it')).not.toBeInTheDocument()
  })

  it('filters active and completed tasks', () => {
    render(<App />)
    const input = screen.getByLabelText('Add a task')
    for (const title of ['Active task', 'Done task']) {
      fireEvent.change(input, { target: { value: title } })
      fireEvent.submit(input.closest('form')!)
    }
    fireEvent.click(screen.getByRole('button', { name: /Complete Done task/ }))
    fireEvent.click(screen.getByRole('button', { name: /Active 1/ }))
    expect(screen.getByText('Active task')).toBeInTheDocument()
    expect(screen.queryByText('Done task')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Completed 1/ }))
    expect(screen.getByText('Done task')).toBeInTheDocument()
  })

  it('persists tasks to localStorage', () => {
    const { unmount } = render(<App />)
    const input = screen.getByLabelText('Add a task')
    fireEvent.change(input, { target: { value: 'Remember me' } })
    fireEvent.submit(input.closest('form')!)
    unmount()
    render(<App />)
    expect(screen.getByText('Remember me')).toBeInTheDocument()
  })
})
