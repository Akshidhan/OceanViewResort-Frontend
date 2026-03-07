import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { parseErrorMessage } from '../lib/http.ts'
import { useAuth } from '../state/useAuth.ts'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      await login({ username, password })
    },
    onSuccess: () => {
      const state = location.state as LocationState | null
      const targetPath = state?.from?.pathname ?? '/reservations'
      navigate(targetPath, { replace: true })
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="ovr-card w-full max-w-md bg-white p-6 sm:p-10">
        <div className="mx-auto w-full max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#60766a]">Staff Login</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#11241b]">Welcome back</h2>
          <p className="mt-2 text-sm text-[#5d7267]">Sign in to access the management dashboard.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate()
            }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#32463d]" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                className="ovr-input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#32463d]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="ovr-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {mutation.isError ? (
              <p className="rounded-xl border border-[#ebc0c4] bg-[#fff4f5] p-2 text-sm text-[#8e2b31]">
                {parseErrorMessage(mutation.error)}
              </p>
            ) : null}

            <button type="submit" className="ovr-button w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
