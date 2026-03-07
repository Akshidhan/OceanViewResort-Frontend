# Release Notes – API Endpoints

**Version:** v0.2.0
**Date:** 03.03.2026

## Functionalities

- User authentication
- Reservation management

## API Endpoints

- **Base API URL:** `/api`

---

### Health

- **GET** `/health`
  - Checks service status
  - Request Body: None

---

### Auth

- **POST** `/auth/login`
  - Authenticate user
  - Sample Request:
    ```json
    {
      "username": "user1",
      "password": "yourPassword"
    }
    ```

- **POST** `/auth/register`
  - Register new user
  - Sample Request:
    ```json
    {
      "username": "user1",
      "password": "yourPassword",
      "email": "user1@example.com"
    }
    ```

---

### Reservation

- **POST** `/reservations`
  - Create reservation
  - Sample Request:
    ```json
    {
      "guestName": "John Doe",
      "address": "123 Main St",
      "contactNumber": "1234567890",
      "roomType": "Deluxe",
      "checkIn": "2024-06-15",
      "checkOut": "2024-06-20"
    }
    ```

- **GET** `/reservations/{id}`
  - Get reservation by ID
  - Request Body: None

- **PUT** `/reservations/{id}`
  - Update reservation
  - Sample Request:
    ```json
    {
      "guestName": "Jane Doe",
      "address": "456 Elm St",
      "contactNumber": "0987654321",
      "roomType": "Suite",
      "checkIn": "2024-06-18",
      "checkOut": "2024-06-22"
    }
    ```

- **DELETE** `/reservations/{id}`
  - Delete reservation
  - Request Body: None

- **GET** `/reservations`
  - List reservations (with filters & pagination)
  - Sample Query Params: `?search=John&roomType=Deluxe&dateFrom=2024-06-01&dateTo=2024-06-30&page=1&pageSize=10`
  - Request Body: None

---

---

# Changelog

---

## v0.3.0 – 2026-03-03

### Added

#### Rooms

- Introduced the **Room** entity with fields: `id`, `name`, `pricePerNight`, `capacity`, `createdAt`, `updatedAt`
- Predefined rooms seeded into the database:
  - Standard Room – $100.00/night (2 people)
  - Deluxe Room – $175.00/night (2 people)
  - Ocean View Suite – $250.00/night (3 people)
  - Family Room – $300.00/night (4 people)
  - Presidential Suite – $500.00/night (4 people)
- Full CRUD API for rooms
- Filter and pagination support on the list rooms endpoint (`search`, `page`, `pageSize`)

#### Reservation (Updated)

- Replaced the free-text `roomType` field with a `roomId` foreign key reference to the `rooms` table
- Reservations now store the resolved `roomName` and `pricePerNight` from the linked room
- Updated filters on the list reservations endpoint: `search`, `roomId`, `dateFrom`, `dateTo`, `page`, `pageSize`

---

## v0.4.0 – 2026-03-05

### Added

#### Billing

- Introduced the **Bill** entity with fields: `id`, `reservationId`, `guestName`, `roomName`, `pricePerNight`, `checkIn`, `checkOut`, `numberOfNights`, `totalCost`, `createdAt`
- Bills are **immutable** – once created they cannot be updated
- Each reservation can only have **one bill** (enforced at the database level with a unique constraint on `reservation_id`)
- Total cost is automatically computed: `numberOfNights × pricePerNight`
- Bill data is a snapshot of the reservation at the time of billing (changes to the reservation after billing do not affect the bill)
- Full billing API: create, get by ID, list all (paginated, filterable by `reservationId`), delete
- `PUT` on `/api/bills/{id}` returns **405 Method Not Allowed** by design

---

## API Endpoints

- **Base API URL:** `/api`

---

### Health

- **GET** `/health`
  - Checks service status
  - Request Body: None

---

### Auth

- **POST** `/auth/login`
  - Authenticate user
  - Sample Request:
    ```json
    {
      "username": "user1",
      "password": "yourPassword"
    }
    ```

- **POST** `/auth/register`
  - Register new user
  - Sample Request:
    ```json
    {
      "username": "user1",
      "password": "yourPassword",
      "email": "user1@example.com"
    }
    ```

---

### Rooms

- **POST** `/rooms`
  - Create a room
  - Sample Request:
    ```json
    {
      "name": "Ocean View Suite",
      "pricePerNight": 250.00,
      "capacity": 3
    }
    ```

- **GET** `/rooms/{id}`
  - Get room by ID
  - Request Body: None

- **PUT** `/rooms/{id}`
  - Update room
  - Sample Request:
    ```json
    {
      "name": "Ocean View Suite",
      "pricePerNight": 275.00,
      "capacity": 3
    }
    ```

- **DELETE** `/rooms/{id}`
  - Delete room
  - Request Body: None

- **GET** `/rooms`
  - List rooms (with filter & pagination)
  - Sample Query Params: `?search=Suite&page=1&pageSize=10`
  - Request Body: None

---

### Reservation

- **POST** `/reservations`
  - Create reservation
  - Sample Request:
    ```json
    {
      "guestName": "John Doe",
      "address": "123 Main St",
      "contactNumber": "1234567890",
      "roomId": 3,
      "checkIn": "2024-06-15",
      "checkOut": "2024-06-20"
    }
    ```

- **GET** `/reservations/{id}`
  - Get reservation by ID
  - Request Body: None

- **PUT** `/reservations/{id}`
  - Update reservation
  - Sample Request:
    ```json
    {
      "guestName": "Jane Doe",
      "address": "456 Elm St",
      "contactNumber": "0987654321",
      "roomId": 2,
      "checkIn": "2024-06-18",
      "checkOut": "2024-06-22"
    }
    ```

- **DELETE** `/reservations/{id}`
  - Delete reservation
  - Request Body: None

- **GET** `/reservations`
  - List reservations (with filters & pagination)
  - Sample Query Params: `?search=John&roomId=3&dateFrom=2024-06-01&dateTo=2024-06-30&page=1&pageSize=10`
  - Request Body: None

---

### Bills

- **POST** `/bills`
  - Generate a bill for a reservation
  - Total cost is computed automatically (`numberOfNights × pricePerNight`)
  - Each reservation can only be billed once
  - Sample Request:
    ```json
    {
      "reservationId": 1
    }
    ```

- **GET** `/bills/{id}`
  - Get bill by ID
  - Request Body: None

- **DELETE** `/bills/{id}`
  - Delete a bill
  - Request Body: None

- **GET** `/bills`
  - List all bills (with pagination, optionally filtered by reservation)
  - Sample Query Params: `?reservationId=1&page=1&pageSize=10`
  - Request Body: None

- **PUT** `/bills/{id}`
  - ❌ Not supported – bills are immutable once created (returns `405 Method Not Allowed`)

