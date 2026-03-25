import '../index.css';
import Providers from '../components/Providers';

import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://yamanfilo.com'),
  title: {
    template: '%s | Yaman Filo',
    default: 'Yaman Filo | Manisa Araç Kiralama & Rent A Car',
  },
  description:
    'Manisa araç kiralama, günlük rent a car ve 2. el araç ihtiyaçlarınız için güvenilir adres Yaman Filo. Hemen fiyatları inceleyin ve rezervasyon yapın.',
  icons: {
    icon: '/favicon.jpg',
    shortcut: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Manisa Araç Kiralama & Rent A Car | Yaman Filo',
    description:
      'Manisa araç kiralama, günlük rent a car ve 2. el araç ihtiyaçlarınız için güvenilir adres Yaman Filo.',
    url: 'https://yamanfilo.com',
    siteName: 'Yaman Filo',
    locale: 'tr_TR',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Yaman Filo - Manisa Araç Kiralama',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manisa Araç Kiralama | Yaman Filo',
    description:
      'Manisa araç kiralama ve 2. el araç ihtiyaçlarınız için güvenilir adres.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
