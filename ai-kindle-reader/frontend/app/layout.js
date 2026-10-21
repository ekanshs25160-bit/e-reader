import './globals.css';
import { ThemeProvider } from '@/components/common/ThemeProvider';

export const metadata = {
  title: 'Flyleaf',
  description: 'A quiet e-reader with an AI margin.',
  applicationName: 'Flyleaf',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#faf9f6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body-ui antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
