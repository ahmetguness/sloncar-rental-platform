import '../index.css';
import Providers from '../components/Providers';
import { ClientOnly } from '../components/ClientOnly';

import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://yamanfilo.com'),
  title: {
    template: '%s | Yaman Filo',
    default: 'Yaman Filo | Manisa Araç Kiralama & Rent A Car',
  },
  description: 'Manisa araç kiralama, günlük rent a car ve 2. el araç ihtiyaçlarınız için güvenilir adres Yaman Filo. Hemen fiyatları inceleyin ve rezervasyon yapın.',
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
    description: 'Manisa araç kiralama, günlük rent a car ve 2. el araç ihtiyaçlarınız için güvenilir adres Yaman Filo. Hemen fiyatları inceleyin ve rezervasyon yapın.',
    url: 'https://yamanfilo.com',
    siteName: 'Yaman Filo',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manisa Araç Kiralama | Yaman Filo',
    description: 'Manisa araç kiralama ve 2. el araç ihtiyaçlarınız için güvenilir adres.',
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
        <ClientOnly>
          <Providers>
            {children}
          </Providers>
        </ClientOnly>
      </body>
    </html>
  );
}
