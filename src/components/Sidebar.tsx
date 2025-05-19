import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-20 bg-[#38BDF8] flex flex-col items-center py-6 gap-8 shadow-lg min-h-screen">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <Image src="/images/Logo.png" alt="ChipFlow Logo" width={80} height={80} />
      </Link>

      {/* Dashboard */}
      <Link 
        href="/" 
        className={`p-3 rounded-lg transition-all hover:scale-110 ${
          pathname === '/' ? 'bg-white/10' : 'hover:bg-white/10'
        }`}
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
          />
        </svg>
      </Link>

      {/* Connections */}
      <Link 
        href="/connections" 
        className={`p-3 rounded-lg transition-all hover:scale-110 ${
          pathname === '/connections' ? 'bg-white/10' : 'hover:bg-white/10'
        }`}
      >
        <Image src="/images/ChipLogo.png" alt="Connections" width={48} height={48} />
      </Link>

      {/* Profile (at bottom) */}
      <div className="mt-auto">
        <Link 
          href="/profile" 
          className={`p-3 rounded-lg transition-all hover:scale-110 ${
            pathname === '/profile' ? 'bg-white/10' : 'hover:bg-white/10'
          }`}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
            />
          </svg>
        </Link>
      </div>
    </div>
  );
} 