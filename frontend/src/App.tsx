import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ScrollToTop from './components/ScrollToTop';
import { Layout } from './components/layout/Layout';

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Booking = lazy(() => import('./pages/Booking').then(m => ({ default: m.Booking })));
const MyBooking = lazy(() => import('./pages/MyBooking').then(m => ({ default: m.MyBooking })));
const Franchise = lazy(() => import('./pages/Franchise').then(m => ({ default: m.Franchise })));
const SecondHand = lazy(() => import('./pages/SecondHand').then(m => ({ default: m.SecondHand })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminRentalCars = lazy(() => import('./pages/AdminRentalCars').then(m => ({ default: m.AdminRentalCars })));
const AdminSaleCars = lazy(() => import('./pages/AdminSaleCars').then(m => ({ default: m.AdminSaleCars })));
const AdminCampaigns = lazy(() => import('./pages/AdminCampaigns').then(m => ({ default: m.AdminCampaigns })));
const CarDetail = lazy(() => import('./pages/CarDetail').then(m => ({ default: m.CarDetail })));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

