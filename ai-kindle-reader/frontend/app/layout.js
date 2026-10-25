import './globals.css';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import ServiceWorkerManager from '@/components/common/ServiceWorkerManager';

export const metadata = {
  title: 'Flyleaf',
  description: 'A quiet e-reader with an AI margin.',
  applicationName: 'Flyleaf',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..700;1,400..700&family=Inter:wght@400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..700&family=Lora:ital,wght@0,400..700;1,400..700&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var m = localStorage.getItem('flyleaf-theme') || 'auto';
    var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = m === 'auto' ? (isDark ? 'night' : 'paper') : (m === 'day' ? 'paper' : m);
    var el = document.documentElement;
    el.classList.remove('dark', 'night', 'sepia', 'oled', 'paper');
    if (resolved === 'night') {
      el.classList.add('dark', 'night');
      el.setAttribute('data-theme', 'night');
    } else if (resolved === 'oled') {
      el.classList.add('dark', 'oled');
      el.setAttribute('data-theme', 'oled');
    } else if (resolved === 'sepia') {
      el.classList.add('sepia');
      el.setAttribute('data-theme', 'sepia');
    } else {
      el.classList.add('paper');
      el.setAttribute('data-theme', 'paper');
    }
  } catch(e) {}
})();`,
          }}
        />
      </head>
      <body className="font-body-ui antialiased">
        <ThemeProvider>
          <ServiceWorkerManager />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
