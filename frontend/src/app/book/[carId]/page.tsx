import { Metadata } from 'next';
import { Booking } from '../../../_pages/Booking';

export const metadata: Metadata = {
  title: 'Araç Rezervasyon | Yaman Filo Manisa',
  description: 'Seçtiğiniz aracı hemen rezerve edin. Yaman Filo ile Manisa ve çevresinde güvenilir araç kiralama deneyimi için rezervasyonunuzu tamamlayın.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <Booking />;
}
