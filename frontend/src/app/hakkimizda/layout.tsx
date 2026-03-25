"use client";
import { Layout } from '../../components/layout/Layout';

export default function HakkimizdaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
