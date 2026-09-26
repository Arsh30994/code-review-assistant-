// src/app/layout.tsx
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Code Review Assistant',
  description: 'Production-ready AI Code Review and Chat Assistant for Developers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-gray-100 min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
