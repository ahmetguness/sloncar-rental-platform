import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Booking } from './pages/Booking';
import { MyBooking } from './pages/MyBooking';
import { Franchise } from './pages/Franchise';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminCars } from './pages/AdminCars';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="book/:carId" element={<Booking />} />
          <Route path="my-booking" element={<MyBooking />} />
          <Route path="franchise" element={<Franchise />} />

          {/* Admin Routes */}
          <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/cars" element={<AdminCars />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
