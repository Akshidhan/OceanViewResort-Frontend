import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { apiRequest, parseErrorMessage } from '../lib/http.ts'
import { extractList } from '../lib/normalizers.ts'
import { useAuth } from '../state/useAuth.ts'
import type { Room } from '../types/models.ts'

type RoomFormValues = {
  name: string
  pricePerNight: string
  capacity: string
}

const defaultFormValues: RoomFormValues = {
  name: '',
  pricePerNight: '',
  capacity: '',
}

export function RoomsPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [form, setForm] = useState<RoomFormValues>(defaultFormValues)
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null)

  const roomsQuery = useQuery({
    queryKey: ['rooms', search, page, pageSize, token],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      if (search.trim()) {
        params.set('search', search.trim())
      }

      const payload = await apiRequest<unknown>(`/rooms?${params.toString()}`, {}, token)
      return extractList<Room>(payload)
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: RoomFormValues) => {
      await apiRequest('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name: values.name,
          pricePerNight: Number(values.pricePerNight),
          capacity: Number(values.capacity),
        }),
      }, token)
    },
    onSuccess: async () => {
      setForm(defaultFormValues)
      await queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: RoomFormValues }) => {
      await apiRequest(`/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: values.name,
          pricePerNight: Number(values.pricePerNight),
          capacity: Number(values.capacity),
        }),
      }, token)
    },
    onSuccess: async () => {
      setEditingRoomId(null)
      setForm(defaultFormValues)
      await queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/rooms/${id}`, { method: 'DELETE' }, token)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })

  const submitError = useMemo(() => {
    if (createMutation.isError) {
      return parseErrorMessage(createMutation.error)
    }
    if (updateMutation.isError) {
      return parseErrorMessage(updateMutation.error)
    }
    return null
  }, [createMutation.error, createMutation.isError, updateMutation.error, updateMutation.isError])

  const items = roomsQuery.data?.items ?? []

  return (
    <div className="space-y-5">
      <section className="ovr-card p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="ovr-title">Rooms</h2>
            <p className="ovr-subtle mt-1">Create and maintain room categories, nightly rates, and guest capacity.</p>
          </div>

          <div className="w-full max-w-sm">
            <label className="mb-1.5 block text-sm font-semibold text-[#2d4037]" htmlFor="room-search">
              Search rooms
            </label>
            <input
              id="room-search"
              className="ovr-input"
              placeholder="Suite, Family, Deluxe..."
              value={search}
              onChange={(event) => {
                setPage(1)
                setSearch(event.target.value)
              }}
            />
          </div>
        </div>
      </section>

      <section className="ovr-card p-5">
        <h3 className="text-base font-bold text-[#11231a]">{editingRoomId ? 'Update room' : 'Create room'}</h3>
        <form
          className="mt-4 grid gap-3 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (editingRoomId) {
              updateMutation.mutate({ id: editingRoomId, values: form })
              return
            }
            createMutation.mutate(form)
          }}
        >
          <input
            className="ovr-input"
            placeholder="Room name"
            value={form.name}
            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
            required
          />
          <input
            className="ovr-input"
            type="number"
            step="0.01"
            min="0"
            placeholder="Price per night"
            value={form.pricePerNight}
            onChange={(event) => setForm((previous) => ({ ...previous, pricePerNight: event.target.value }))}
            required
          />
          <input
            className="ovr-input"
            type="number"
            min="1"
            placeholder="Capacity"
            value={form.capacity}
            onChange={(event) => setForm((previous) => ({ ...previous, capacity: event.target.value }))}
            required
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="ovr-button"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingRoomId ? 'Save' : 'Create'}
            </button>

            <button
              type="button"
              className="ovr-button-muted"
              onClick={() => {
                setEditingRoomId(null)
                setForm(defaultFormValues)
              }}
            >
              Reset
            </button>
          </div>
        </form>

        {submitError ? (
          <p className="mt-3 rounded-xl border border-[#ebc0c4] bg-[#fff4f5] p-2 text-sm text-[#8e2b31]">{submitError}</p>
        ) : null}
      </section>

      <section className="ovr-card overflow-hidden p-5">
        {roomsQuery.isLoading ? <p className="ovr-subtle">Loading rooms...</p> : null}
        {roomsQuery.isError ? (
          <p className="rounded-xl border border-[#ebc0c4] bg-[#fff4f5] p-2 text-sm text-[#8e2b31]">
            {parseErrorMessage(roomsQuery.error)}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="ovr-table min-w-[620px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price / night</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((room) => (
                <tr key={room.id}>
                  <td className="font-semibold text-[#20382d]">{room.name}</td>
                  <td>${Number(room.pricePerNight).toFixed(2)}</td>
                  <td>{room.capacity} guests</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="ovr-button-muted"
                        onClick={() => {
                          setEditingRoomId(room.id)
                          setForm({
                            name: room.name,
                            pricePerNight: String(room.pricePerNight),
                            capacity: String(room.capacity),
                          })
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="ovr-button-muted ovr-danger"
                        onClick={() => deleteMutation.mutate(room.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && !roomsQuery.isLoading ? (
                <tr>
                  <td className="ovr-subtle py-6" colSpan={4}>
                    No rooms found with the current filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#5d7368]">Total rooms: {roomsQuery.data?.total ?? 0}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="ovr-button-muted"
              disabled={page === 1}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="ovr-button-muted"
              onClick={() => setPage((previous) => previous + 1)}
              disabled={items.length < pageSize}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
