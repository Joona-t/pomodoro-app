import '../app/globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Pomodoro Timer',
  description: 'A simple pomodoro timer with tasks and session logging.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen flex flex-col items-center justify-start p-4">
          {children}
        </main>
      </body>
    </html>
  );
}