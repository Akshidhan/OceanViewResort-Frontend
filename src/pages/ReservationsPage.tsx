import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { apiRequest, parseErrorMessage } from '../lib/http.ts'
import { extractList } from '../lib/normalizers.ts'
import { useAuth } from '../state/useAuth.ts'
import type { Reservation, Room } from '../types/models.ts'

type ReservationFormValues = {
  guestName: string
  address: string
  contactNumber: string
  roomId: string
  checkIn: string
  checkOut: string
}

const defaultForm: ReservationFormValues = {
  guestName: '',
  address: '',
  contactNumber: '',
  roomId: '',
  checkIn: '',
  checkOut: '',
}

export function ReservationsPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [roomIdFilter, setRoomIdFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ReservationFormValues>(defaultForm)

  const roomsQuery = useQuery({
    queryKey: ['rooms-options', token],
    queryFn: async () => {
      const payload = await apiRequest<unknown>('/rooms?page=1&pageSize=100', {}, token)
      return extractList<Room>(payload).items
    },
  })

  const reservationsQuery = useQuery({
    queryKey: ['reservations', search, roomIdFilter, dateFrom, dateTo, page, pageSize, token],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })

      if (search.trim()) params.set('search', search.trim())
      if (roomIdFilter) params.set('roomId', roomIdFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const payload = await apiRequest<unknown>(`/reservations?${params.toString()}`, {}, token)
      return extractList<Reservation>(payload)
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: ReservationFormValues) => {
      await apiRequest('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          guestName: values.guestName,
          address: values.address,
          contactNumber: values.contactNumber,
          roomId: Number(values.roomId),
          checkIn: values.checkIn,
          checkOut: values.checkOut,
        }),
      }, token)
    },
    onSuccess: async () => {
      setForm(defaultForm)
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: ReservationFormValues }) => {
      await apiRequest(`/reservations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          guestName: values.guestName,
          address: values.address,
          contactNumber: values.contactNumber,
          roomId: Number(values.roomId),
          checkIn: values.checkIn,
          checkOut: values.checkOut,
        }),
      }, token)
    },
    onSuccess: async () => {
      setEditingId(null)
      setForm(defaultForm)
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/reservations/${id}`, { method: 'DELETE' }, token)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
      await queryClient.invalidateQueries({ queryKey: ['bills'] })
    },
  })

  const submitError = useMemo(() => {
    if (createMutation.isError) return parseErrorMessage(createMutation.error)
    if (updateMutation.isError) return parseErrorMessage(updateMutation.error)
    return null
  }, [createMutation.error, createMutation.isError, updateMutation.error, updateMutation.isError])

  const reservations = reservationsQuery.data?.items ?? []

  return (
    <div className="space-y-5">
      <section className="ovr-card p-5">
        <h2 className="ovr-title">Reservations</h2>
        <p className="ovr-subtle mt-1">Create and maintain guest reservations connected to room inventory.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <input
            className="ovr-input"
            placeholder="Search guest"
            value={search}
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
          />
          <select
            className="ovr-input"
            value={roomIdFilter}
            onChange={(event) => {
              setPage(1)
              setRoomIdFilter(event.target.value)
            }}
          >
            <option value="">All rooms</option>
            {(roomsQuery.data ?? []).map((room) => (
              <option key={room.id} value={String(room.id)}>
                {room.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="ovr-input"
            value={dateFrom}
            onChange={(event) => {
              setPage(1)
              setDateFrom(event.target.value)
            }}
          />
          <input
            type="date"
            className="ovr-input"
            value={dateTo}
            onChange={(event) => {
              setPage(1)
              setDateTo(event.target.value)
            }}
          />
          <button
            type="button"
            className="ovr-button-muted"
            onClick={() => {
              setSearch('')
              setRoomIdFilter('')
              setDateFrom('')
              setDateTo('')
              setPage(1)
            }}
          >
            Clear filters
          </button>
        </div>
      </section>

      <section className="ovr-card p-5">
        <h3 className="text-base font-bold text-[#11231a]">{editingId ? 'Update reservation' : 'Create reservation'}</h3>

        <form
          className="mt-4 grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (editingId) {
              updateMutation.mutate({ id: editingId, values: form })
              return
            }
            createMutation.mutate(form)
          }}
        >
          <input
            className="ovr-input"
            placeholder="Guest name"
            value={form.guestName}
            onChange={(event) => setForm((previous) => ({ ...previous, guestName: event.target.value }))}
            required
          />
          <input
            className="ovr-input"
            placeholder="Address"
            value={form.address}
            onChange={(event) => setForm((previous) => ({ ...previous, address: event.target.value }))}
            required
          />
          <input
            className="ovr-input"
            placeholder="Contact number"
            value={form.contactNumber}
            onChange={(event) => setForm((previous) => ({ ...previous, contactNumber: event.target.value }))}
            required
          />
          <select
            className="ovr-input"
            value={form.roomId}
            onChange={(event) => setForm((previous) => ({ ...previous, roomId: event.target.value }))}
            required
          >
            <option value="">Select room</option>
            {(roomsQuery.data ?? []).map((room) => (
              <option key={room.id} value={String(room.id)}>
                {room.name}
              </option>
            ))}
          </select>
          <input
            className="ovr-input"
            type="date"
            value={form.checkIn}
            onChange={(event) => setForm((previous) => ({ ...previous, checkIn: event.target.value }))}
            required
          />
          <input
            className="ovr-input"
            type="date"
            value={form.checkOut}
            onChange={(event) => setForm((previous) => ({ ...previous, checkOut: event.target.value }))}
            required
          />

          <div className="flex gap-2 md:col-span-3">
            <button
              type="submit"
              className="ovr-button"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? 'Save' : 'Create'}
            </button>
            <button
              type="button"
              className="ovr-button-muted"
              onClick={() => {
                setEditingId(null)
                setForm(defaultForm)
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
        {reservationsQuery.isLoading ? <p className="ovr-subtle">Loading reservations...</p> : null}
        {reservationsQuery.isError ? (
          <p className="rounded-xl border border-[#ebc0c4] bg-[#fff4f5] p-2 text-sm text-[#8e2b31]">
            {parseErrorMessage(reservationsQuery.error)}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="ovr-table min-w-[900px]">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Contact</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>
                    <p className="font-semibold text-[#20382d]">{reservation.guestName}</p>
                    <p className="ovr-subtle">{reservation.address}</p>
                  </td>
                  <td>{reservation.contactNumber}</td>
                  <td>{reservation.roomName ?? `Room #${reservation.roomId}`}</td>
                  <td>{reservation.checkIn}</td>
                  <td>{reservation.checkOut}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="ovr-button-muted"
                        onClick={() => {
                          setEditingId(reservation.id)
                          setForm({
                            guestName: reservation.guestName,
                            address: reservation.address,
                            contactNumber: reservation.contactNumber,
                            roomId: String(reservation.roomId),
                            checkIn: reservation.checkIn,
                            checkOut: reservation.checkOut,
                          })
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ovr-button-muted ovr-danger"
                        onClick={() => deleteMutation.mutate(reservation.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {reservations.length === 0 && !reservationsQuery.isLoading ? (
                <tr>
                  <td className="ovr-subtle py-6" colSpan={6}>
                    No reservations found with the current filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#5d7368]">Total reservations: {reservationsQuery.data?.total ?? 0}</p>
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
              disabled={reservations.length < pageSize}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
