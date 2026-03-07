import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell.tsx'
import { RequireAuth } from './components/RequireAuth.tsx'
import { BillsPage } from './pages/BillsPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { ReservationsPage } from './pages/ReservationsPage.tsx'
import { RoomsPage } from './pages/RoomsPage.tsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/reservations" replace />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/bills" element={<BillsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/reservations" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
