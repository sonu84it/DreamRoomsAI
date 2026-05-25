import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import SessionProvider from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: 'DreamRooms AI | Cinematic Interior Inspiration Feed',
  description: 'AI-powered cinematic home interior inspiration platform. Discover endlessly generated luxury, Japandi, Scandinavian, and modern room designs.',
  keywords: 'DreamRooms, AI interior design, home inspiration, luxury decor, virtual rooms, cinematic architecture',
  openGraph: {
    title: 'DreamRooms AI | Cinematic Interior Inspiration Feed',
    description: 'AI-powered cinematic home interior inspiration platform. Discover endlessly generated luxury, Japandi, Scandinavian, and modern room designs.',
    type: 'website',
    locale: 'en_US',
    siteName: 'DreamRooms AI',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground relative selection:bg-amber-500/30 selection:text-amber-200">
        {/* Background glows */}
        <div className="luxury-glow top-0 left-[10%]"></div>
        <div className="luxury-glow-cyan top-[40%] right-[5%]"></div>
        <div className="luxury-glow bottom-0 left-[15%]"></div>

        <SessionProvider>
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
              {children}
            </main>
            <footer className="w-full border-t border-white/5 py-8 mt-16 text-center text-xs text-neutral-500 glass-panel-light relative z-10">
              <div className="max-w-7xl mx-auto px-4">
                <p className="mb-2">© {new Date().getFullYear()} DreamRooms AI. All rights reserved.</p>
                <p>Powered by Google Cloud Run, Firebase, Vertex AI Omni / Veo, & Cloud SQL.</p>
              </div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
