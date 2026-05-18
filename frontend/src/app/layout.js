import { Inter, Fredoka } from 'next/font/google';
import PropTypes from 'prop-types';
import { AuthProvider } from '@/utils/context/authContext';

import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/globals.css';
import '@/styles/theme.css';

export const metadata = {
  title: '1RockstarSocial — Event Sites Made Easy',
  description: 'Create a beautiful, personalized event site in minutes. RSVP tracking, photo sharing, games, and more.',
  icons: {
    icon: '/icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
};

const inter = Inter({ subsets: ['latin'] });
export const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-fredoka' });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${fredoka.variable}`}
        style={{
          '--bg-image-url': 'none',
          '--party-primary': '#3B82F6',
          '--party-secondary': '#8B5CF6',
          '--party-accent': '#F59E0B',
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
