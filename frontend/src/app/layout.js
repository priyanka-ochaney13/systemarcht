import { Suspense } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import { CustomLoader } from "@/components/common/CustomLoader";
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { LearningProgressHydration } from "@/components/common/LearningProgressHydration";
import "./globals.css";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'SystemArcht - AWS Architecture Learning Platform',
  description: 'Design, simulate, and learn cloud architectures with real-world system design patterns',
};

const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme = stored === 'dark' ? 'dark' : 'light';
    var root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <LearningProgressHydration />
        <Suspense fallback={<CustomLoader />}>
            {children}
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
