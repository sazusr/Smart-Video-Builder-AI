import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { User } from 'firebase/auth';
import { UserProfile } from '../hooks/useAuth';

export default function Layout({ user, profile }: { user: User | null, profile: UserProfile | null }) {
  return (
    <div className="flex min-h-screen bg-bg-dark">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
