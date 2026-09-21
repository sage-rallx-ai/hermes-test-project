import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

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

  it('adds a task when randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (values: Uint32Array) => values.fill(1),
    })
    render(<App />)
    const input = screen.getByLabelText('Add a task')
    fireEvent.change(input, { target: { value: 'Works over HTTP' } })
    fireEvent.submit(input.closest('form')!)
    expect(screen.getByText('Works over HTTP')).toBeInTheDocument()
  })
  it('switches and persists dark mode', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()

    cleanup()
    render(<App />)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('asks for confirmation before deleting a task', () => {
    const confirm = vi.spyOn(window, 'confirm')
    render(<App />)
    const input = screen.getByLabelText('Add a task')
    fireEvent.change(input, { target: { value: 'Keep this task' } })
    fireEvent.submit(input.closest('form')!)

    confirm.mockReturnValueOnce(false)
    fireEvent.click(screen.getByRole('button', { name: 'Delete Keep this task' }))
    expect(screen.getByText('Keep this task')).toBeInTheDocument()

    confirm.mockReturnValueOnce(true)
    fireEvent.click(screen.getByRole('button', { name: 'Delete Keep this task' }))
    expect(screen.queryByText('Keep this task')).not.toBeInTheDocument()
  })

  it('toggles and deletes tasks', () => {
    render(<App />)
    const input = screen.getByLabelText('Add a task')
    fireEvent.change(input, { target: { value: 'Ship it' } })
    fireEvent.submit(input.closest('form')!)
    fireEvent.click(screen.getByRole('button', { name: 'Complete Ship it' }))
    expect(screen.getByRole('button', { name: 'Mark Ship it active' })).toHaveAttribute('aria-pressed', 'true')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
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