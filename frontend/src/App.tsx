import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Booking } from './pages/Booking';
import { MyBooking } from './pages/MyBooking';
import { Franchise } from './pages/Franchise';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminCars } from './pages/AdminCars';
import { AdminCampaigns } from './pages/AdminCampaigns';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
          <Route path="admin/campaigns" element={<AdminCampaigns />} />

          {/* Fallback */}
          <Route path="*" element={<div>Page Not Found: {window.location.pathname}</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
