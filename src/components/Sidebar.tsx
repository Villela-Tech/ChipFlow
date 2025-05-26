import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

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

      {/* Profile (at bottom) */}
      <div className="mt-auto">
        <Link 
          href="/profile" 
          className={`p-3 rounded-lg transition-all hover:scale-110 ${
            pathname === '/profile' ? 'bg-white/10' : 'hover:bg-white/10'
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
              d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="1.5" 
              d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
} 