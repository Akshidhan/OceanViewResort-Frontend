import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { apiRequest, parseErrorMessage } from '../lib/http.ts'
import { extractList } from '../lib/normalizers.ts'
import { useAuth } from '../state/useAuth.ts'
import type { Bill, Reservation } from '../types/models.ts'

function toCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function BillsPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const [reservationIdFilter, setReservationIdFilter] = useState('')
  const [billReservationId, setBillReservationId] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const reservationsQuery = useQuery({
    queryKey: ['reservations-options', token],
    queryFn: async () => {
      const payload = await apiRequest<unknown>('/reservations?page=1&pageSize=100', {}, token)
      return extractList<Reservation>(payload).items
    },
  })

  const billsQuery = useQuery({
    queryKey: ['bills', reservationIdFilter, page, pageSize, token],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      if (reservationIdFilter) {
        params.set('reservationId', reservationIdFilter)
      }

      const payload = await apiRequest<unknown>(`/bills?${params.toString()}`, {}, token)
      return extractList<Bill>(payload)
    },
  })

  const createMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      await apiRequest('/bills', {
        method: 'POST',
        body: JSON.stringify({ reservationId: Number(reservationId) }),
      }, token)
    },
    onSuccess: async () => {
      setBillReservationId('')
      await queryClient.invalidateQueries({ queryKey: ['bills'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/bills/${id}`, { method: 'DELETE' }, token)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bills'] })
    },
  })

  const submitError = useMemo(() => {
    if (createMutation.isError) return parseErrorMessage(createMutation.error)
    return null
  }, [createMutation.error, createMutation.isError])

  const bills = billsQuery.data?.items ?? []

  return (
    <div className="space-y-5">
      <section className="ovr-card p-5">
        <h2 className="ovr-title">Bills</h2>
        <p className="ovr-subtle mt-1">Generate immutable billing snapshots from reservations and manage bill records.</p>
      </section>

      <section className="ovr-card p-5">
        <h3 className="text-base font-bold text-[#11231a]">Generate bill</h3>
        <form
          className="mt-4 flex flex-col gap-3 md:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            createMutation.mutate(billReservationId)
          }}
        >
          <select
            className="ovr-input max-w-md"
            value={billReservationId}
            onChange={(event) => setBillReservationId(event.target.value)}
            required
          >
            <option value="">Select reservation to bill</option>
            {(reservationsQuery.data ?? []).map((reservation) => (
              <option key={reservation.id} value={String(reservation.id)}>
                #{reservation.id} - {reservation.guestName} ({reservation.checkIn} to {reservation.checkOut})
              </option>
            ))}
          </select>

          <button type="submit" className="ovr-button" disabled={createMutation.isPending || !billReservationId}>
            {createMutation.isPending ? 'Generating...' : 'Generate bill'}
          </button>
        </form>

        {submitError ? (
          <p className="mt-3 rounded-xl border border-[#ebc0c4] bg-[#fff4f5] p-2 text-sm text-[#8e2b31]">{submitError}</p>
        ) : null}
      </section>

      <section className="ovr-card p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,300px)_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#2d4037]" htmlFor="reservation-filter">
              Filter by reservation
            </label>
            <select
              id="reservation-filter"
              className="ovr-input"
              value={reservationIdFilter}
              onChange={(event) => {
                setPage(1)
                setReservationIdFilter(event.target.value)
              }}
            >
              <option value="">All reservations</option>
              {(reservationsQuery.data ?? []).map((reservation) => (
                <option key={reservation.id} value={String(reservation.id)}>
                  #{reservation.id} - {reservation.guestName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              className="ovr-button-muted"
              onClick={() => {
                setReservationIdFilter('')
                setPage(1)
              }}
            >
              Clear filter
            </button>
          </div>
        </div>
      </section>

      <section className="ovr-card overflow-hidden p-5">
        {billsQuery.isLoading ? <p className="ovr-subtle">Loading bills...</p> : null}
        {billsQuery.isError ? (
          <p className="rounded-xl border border-[#ebc0c4] bg-[#fff4f5] p-2 text-sm text-[#8e2b31]">
            {parseErrorMessage(billsQuery.error)}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="ovr-table min-w-[980px]">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reservation</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Nights</th>
                <th>Rate</th>
                <th>Total</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td className="font-semibold text-[#20382d]">#{bill.id}</td>
                  <td>#{bill.reservationId}</td>
                  <td>{bill.guestName}</td>
                  <td>{bill.roomName}</td>
                  <td>{bill.numberOfNights}</td>
                  <td>{toCurrency(Number(bill.pricePerNight))}</td>
                  <td className="font-semibold text-[#1d5d43]">{toCurrency(Number(bill.totalCost))}</td>
                  <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      type="button"
                      className="ovr-button-muted ovr-danger"
                      onClick={() => deleteMutation.mutate(bill.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {bills.length === 0 && !billsQuery.isLoading ? (
                <tr>
                  <td className="ovr-subtle py-6" colSpan={9}>
                    No bills found for the current filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#5d7368]">Total bills: {billsQuery.data?.total ?? 0}</p>
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
              disabled={bills.length < pageSize}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
