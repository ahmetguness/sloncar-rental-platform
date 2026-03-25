import { Metadata } from 'next';
import { Profile } from '../../_pages/Profile';

export const metadata: Metadata = {
  title: 'Profilim | Yaman Filo Manisa',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <Profile />;
}
