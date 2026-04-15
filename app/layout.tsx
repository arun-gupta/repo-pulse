import type { Metadata } from "next";
import { DevToolsLink } from "@/components/debug/DevToolsLink";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoPulse — OSS Health Score",
  description: "Measure the health of your open source projects with percentile-based scoring calibrated against 200+ GitHub repositories.",
};

const themeInitScript = `(() => {
  try {
    var stored = window.localStorage.getItem('repopulse-theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === 'dark' || (stored !== 'light' && prefersDark);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          {children}
          <DevToolsLink />
        </ThemeProvider>
      </body>
    </html>
  );
}
