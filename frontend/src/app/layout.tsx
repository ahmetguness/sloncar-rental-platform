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
    'Yaman Filo, Manisa\'da güvenilir araç kiralama hizmeti sunar. Günlük ve uzun dönem rent a car çözümlerini hemen inceleyin.',
  keywords: [
    'Yaman Filo',
    'Manisa araç kiralama',
    'Manisa rent a car',
    'araç kiralama',
    'günlük araç kiralama',
    'filo kiralama',
    'kiralık araç Manisa',
    '2. el araç Manisa',
    'oto kiralama',
  ],
  authors: [{ name: 'Yaman Filo', url: 'https://yamanfilo.com' }],
  creator: 'Yaman Filo',
  publisher: 'Yaman Filo',
  category: 'Araç Kiralama',
  verification: {
    google: 'kOjqG4aEkYycXGbChmO-IJLsufkwxow0YtXwd5S2YJo',
  },
  icons: {
    icon: '/favicon.jpg',
    shortcut: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
  alternates: {
    canonical: '/',
    languages: {
      'tr-TR': '/',
    },
  },
  openGraph: {
    title: 'Yaman Filo | Manisa Araç Kiralama & Rent A Car',
    description:
      'Yaman Filo, Manisa\'da güvenilir araç kiralama hizmeti sunar. Günlük ve uzun dönem rent a car çözümlerini hemen inceleyin.',
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
    title: 'Yaman Filo | Manisa Araç Kiralama & Rent A Car',
    description:
      'Yaman Filo, Manisa\'da güvenilir araç kiralama hizmeti sunar. Günlük ve uzun dönem rent a car çözümlerini hemen inceleyin.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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