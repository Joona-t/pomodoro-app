import '../app/globals.css';
import type { ReactNode } from 'react';
import { Nunito } from 'next/font/google';

export const metadata = {
  title: 'Pomodoro Timer',
  description: 'A simple pomodoro timer with tasks and session logging.',
};

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={nunito.variable}>
        <main className="min-h-screen flex flex-col items-center justify-start p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
