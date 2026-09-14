import { usePathname } from './routes/router';
import LandingPage from './pages/LandingPage';
import GalleryApp from './pages/GalleryApp';
import ExperiencePage from './pages/ExperiencePage';

export default function App() {
  const pathname = usePathname();

  if (pathname === '/gallery') return <GalleryApp />;
  if (pathname === '/experience') return <ExperiencePage />;
  return <LandingPage />;
}
