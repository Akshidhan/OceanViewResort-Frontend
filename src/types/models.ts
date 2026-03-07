export type Room = {
  id: number
  name: string
  pricePerNight: number
  capacity: number
  createdAt?: string
  updatedAt?: string
}

export type Reservation = {
  id: number
  guestName: string
  address: string
  contactNumber: string
  roomId: number
  roomName?: string
  pricePerNight?: number
  checkIn: string
  checkOut: string
  createdAt?: string
  updatedAt?: string
}

export type Bill = {
  id: number
  reservationId: number
  guestName: string
  roomName: string
  pricePerNight: number
  checkIn: string
  checkOut: string
  numberOfNights: number
  totalCost: number
  createdAt: string
}

export type LoginPayload = {
  username: string
  password: string
}

export type LoginResult = {
  token?: string
  accessToken?: string
  jwt?: string
}
