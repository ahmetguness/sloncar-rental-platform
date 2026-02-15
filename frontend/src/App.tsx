import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Booking } from './pages/Booking';
import { MyBooking } from './pages/MyBooking';
import { Franchise } from './pages/Franchise';
import { SecondHand } from './pages/SecondHand'; // Import
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminRentalCars } from './pages/AdminRentalCars';
import { AdminSaleCars } from './pages/AdminSaleCars';
import { AdminCampaigns } from './pages/AdminCampaigns';
import { CarDetail } from './pages/CarDetail';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="second-hand" element={<SecondHand />} />
          <Route path="car/:id" element={<CarDetail />} />
          <Route path="book/:carId" element={<Booking />} />
          <Route path="my-booking" element={<MyBooking />} />
          <Route path="franchise" element={<Franchise />} />

          {/* Admin Routes */}
          <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/cars/rental" element={<AdminRentalCars />} />
          <Route path="admin/cars/sale" element={<AdminSaleCars />} />
          <Route path="admin/cars" element={<Navigate to="/admin/cars/rental" replace />} />
          <Route path="admin/campaigns" element={<AdminCampaigns />} />

          {/* Fallback */}
          <Route path="*" element={<div>Page Not Found: {window.location.pathname}</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
