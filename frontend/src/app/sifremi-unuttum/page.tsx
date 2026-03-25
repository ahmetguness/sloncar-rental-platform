import { Metadata } from 'next';
import { Suspense } from 'react';
import { ForgotPassword } from '../../_pages/ForgotPassword';

export const metadata: Metadata = {
  title: 'Şifremi Unuttum | Yaman Filo Manisa',
  description: 'Yaman Filo şifre sıfırlama.',
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
        <ForgotPassword />
      </Suspense>
    </Layout>
  );
}
