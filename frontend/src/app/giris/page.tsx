import { Metadata } from 'next';
import { Login } from '../../_pages/Login';

export const metadata: Metadata = {
  title: 'Giriş Yap | Yaman Filo Manisa',
  description: 'Yaman Filo üye girişi. Bireysel veya kurumsal hesabınıza erişin.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <Login />;
}
