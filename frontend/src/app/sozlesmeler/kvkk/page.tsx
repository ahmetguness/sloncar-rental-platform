import { Metadata } from 'next';
import { Layout } from '../../../components/layout/Layout';
import { KVKK } from '../../../_pages/KVKK';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma ve Açık Rıza Metni | Yaman Filo',
  description: 'Yaman Filo Kişisel Verilerin Korunması Kanunu (KVKK) aydınlatma ve açık rıza metni.',
  alternates: {
    canonical: '/sozlesmeler/kvkk',
  },
};

export default function Page() {
  return (
    <Layout>
      <KVKK />
    </Layout>
  );
}
