import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daylight — your everyday AI companion',
  description: 'A friendly AI assistant for planning, notes, questions, and everyday life.',
  applicationName: 'Daylight',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
