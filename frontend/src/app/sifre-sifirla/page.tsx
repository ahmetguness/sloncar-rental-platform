import { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPassword } from '../../_pages/ResetPassword';

export const metadata: Metadata = {
  title: 'Şifre Sıfırla | Yaman Filo Manisa',
  description: 'Yaman Filo yeni şifre belirleme.',
  robots: {
    index: false,
    follow: true,
  },
};

import { Layout } from '../../components/layout/Layout';

export default function Page() {
  return (
    <Layout>
      <Suspense>
        <ResetPassword />
      </Suspense>
    </Layout>
  );
}
