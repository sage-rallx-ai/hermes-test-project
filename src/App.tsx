import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useTheme } from './useTheme'
import './App.css'

type Todo = {
  id: string
  title: string
  completed: boolean
}

type Filter = 'all' | 'active' | 'completed'

const STORAGE_KEY = 'hermes-test-project.todos'

function createTodoId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const values = new Uint32Array(4)
    globalThis.crypto.getRandomValues(values)
    return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('-')
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function loadTodos(): Todo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (todo): todo is Todo =>
        typeof todo === 'object' &&
        todo !== null &&
        typeof (todo as Todo).id === 'string' &&
        typeof (todo as Todo).title === 'string' &&
        typeof (todo as Todo).completed === 'boolean',
    )
  } catch {
    return []
  }
}

function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [draft, setDraft] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const activeCount = todos.filter((todo) => !todo.completed).length
  const completedCount = todos.length - activeCount
  const visibleTodos = useMemo(
    () => todos.filter((todo) => filter === 'all' || (filter === 'active' ? !todo.completed : todo.completed)),
    [filter, todos],
  )

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = draft.trim()
    if (!title) return
    setTodos((current) => [...current, { id: createTodoId(), title, completed: false }])
    setDraft('')
  }

  function toggleTodo(id: string) {
    setTodos((current) => current.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const deleteTodo = (id: string, title: string) => {
    if (!window.confirm(`Delete “${title}”?`)) return
    setTodos((current) => current.filter((todo) => todo.id !== id))
  }

  const filterLabels: Array<{ value: Filter; label: string; count: number }> = [
    { value: 'all', label: 'All', count: todos.length },
    { value: 'active', label: 'Active', count: activeCount },
    { value: 'completed', label: 'Completed', count: completedCount },
  ]

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-topline">
          <p className="eyebrow">A little less clutter</p>
          <button
            type="button"
            className="theme-toggle"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
        <h1>Today, sorted.</h1>
        <p className="subtitle">Capture what matters, then make space for what’s next.</p>
      </header>

      <section className="todo-card" aria-labelledby="todo-heading">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Your list</p>
            <h2 id="todo-heading">Tasks</h2>
          </div>
          <span className="task-count">{activeCount} left</span>
        </div>

        <form className="todo-form" onSubmit={addTodo}>
          <label className="sr-only" htmlFor="new-todo">Add a task</label>
          <input
            id="new-todo"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="What needs doing?"
            autoComplete="off"
          />
          <button type="submit">Add task</button>
        </form>

        <div className="filters" role="group" aria-label="Filter tasks">
          {filterLabels.map(({ value, label, count }) => (
            <button
              key={value}
              type="button"
              className={filter === value ? 'filter-button selected' : 'filter-button'}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label} <span>{count}</span>
            </button>
          ))}
        </div>

        <ul className="todo-list" aria-live="polite">
          {visibleTodos.map((todo) => (
            <li className={todo.completed ? 'todo-item completed' : 'todo-item'} key={todo.id}>
              <button
                type="button"
                className="check-button"
                aria-label={todo.completed ? `Mark ${todo.title} active` : `Complete ${todo.title}`}
                aria-pressed={todo.completed}
                onClick={() => toggleTodo(todo.id)}
              >
                {todo.completed ? '✓' : ''}
              </button>
              <span className="todo-title">{todo.title}</span>
              <button type="button" className="delete-button" aria-label={`Delete ${todo.title}`} onClick={() => deleteTodo(todo.id, todo.title)}>
                ×
              </button>
            </li>
          ))}
        </ul>

        {visibleTodos.length === 0 && (
          <p className="empty-state">
            {todos.length === 0 ? 'Your list is clear. Add a task to get started.' : `No ${filter} tasks right now.`}
          </p>
        )}
      </section>

      <footer>Small steps still count.</footer>
    </main>
  )
}

export default App
