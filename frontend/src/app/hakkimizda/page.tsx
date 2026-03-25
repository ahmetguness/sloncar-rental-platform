import { Metadata } from 'next';
import { About } from '../../_pages/About';

export const metadata: Metadata = {
  title: 'Hakkımızda | Yaman Filo - Manisa Araç Kiralama',
  description: 'Manisa araç kiralama sektöründe yılların tecrübesiyle Yaman Filo. Müşteri memnuniyeti odaklı, güvenilir ve şeffaf hizmet anlayışımızı keşfedin.',
  alternates: {
    canonical: '/hakkimizda',
  },
};

export default function Page() {
  return <About />;
}
