import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import { DISCLAIMER } from '../../utils/constants.js';

// Wraps authenticated pages with the persistent nav + a gentle footer
// disclaimer (peer support, not professional care).
export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-center">
        <p className="text-xs leading-relaxed text-lavender-400">{DISCLAIMER}</p>
        <p className="mt-2 text-xs font-bold text-lavender-400">Made with ❤️ by Shara</p>
      </footer>
    </div>
  );
}
