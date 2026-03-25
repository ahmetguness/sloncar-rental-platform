import { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmail } from '../../_pages/VerifyEmail';

export const metadata: Metadata = {
  title: 'E-posta Doğrulama | Yaman Filo Manisa',
  description: 'E-posta adresinizi doğrulayarak hesabınızı aktifleştirin.',
  robots: {
    index: false,
    follow: false,
  },
};

import { Layout } from '../../components/layout/Layout';

export default function Page() {
  return (
    <Layout>
      <Suspense>
        <VerifyEmail />
      </Suspense>
    </Layout>
  );
}
