import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="w-20 bg-[#38BDF8] flex flex-col items-center py-6 gap-8 shadow-lg min-h-screen">
      {/* Logo */}
      <Image src="/images/Logo.png" alt="ChipFlow Logo" width={80} height={80} className="mb-8" />

      {/* Chip Management */}
      <Link 
        href="/chips" 
        className={`p-3 rounded-lg transition-all hover:scale-110 ${
          pathname === '/chips' ? 'bg-white/10' : 'hover:bg-white/10'
        }`}
      >
        <Image src="/images/ChipLogo.png" alt="Chips" width={48} height={48} />
      </Link>

      {/* Connections */}
      <Link 
        href="/connections" 
        className={`p-3 rounded-lg transition-all hover:scale-110 ${
          pathname === '/connections' ? 'bg-white/10' : 'hover:bg-white/10'
        }`}
      >
        <svg 
          className="w-8 h-8 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="1.5"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </Link>

      {/* Kanban Board */}
      <Link 
        href="/kanban" 
        className={`p-3 rounded-lg transition-all hover:scale-110 ${
          pathname === '/kanban' ? 'bg-white/10' : 'hover:bg-white/10'
        }`}
      >
        <svg 
          className="w-8 h-8 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </Link>

      {/* Users Management */}
      <Link 
        href="/users" 
        className={`p-3 rounded-lg transition-all hover:scale-110 ${
          pathname === '/users' ? 'bg-white/10' : 'hover:bg-white/10'
        }`}
      >
        <svg 
          className="w-8 h-8 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="1.5" 
            d="M17 20H7C5.89543 20 5 19.1046 5 18V6C5 4.89543 5.89543 4 7 4H17C18.1046 4 19 4.89543 19 6V18C19 19.1046 18.1046 20 17 20Z"
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="1.5" 
            d="M12 8C13.1046 8 14 8.89543 14 10C14 11.1046 13.1046 12 12 12C10.8954 12 10 11.1046 10 10C10 8.89543 10.8954 8 12 8Z"
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="1.5" 
            d="M15 15C15 13.3431 13.6569 12 12 12C10.3431 12 9 13.3431 9 15"
          />
        </svg>
      </Link>

      {/* Logout Button (at bottom) */}
      <button 
        onClick={logout}
        className="mt-auto p-3 rounded-lg transition-all hover:scale-110 hover:bg-white/10 focus:outline-none"
        title="Sair"
      >
        <svg 
          className="w-8 h-8 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="1.5" 
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    </div>
  );
} 