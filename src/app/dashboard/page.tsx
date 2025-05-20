'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Importação dinâmica para evitar problemas de SSR com Material UI
// const QuickUserSetup = dynamic(() => import('@/components/QuickUserSetup'), {
//   ssr: false,
//   loading: () => <div className="h-10 bg-gray-200 animate-pulse rounded-md w-64"></div>
// });

const UserCreationForm = dynamic(() => import('@/components/UserCreationForm'), {
  ssr: false,
  loading: () => <div className="h-10 bg-gray-200 animate-pulse rounded-md w-64"></div>
});

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [companyId] = useState<number>(1); // Valor padrão para companyId
  
  useEffect(() => {
    // Verificar se existe token no localStorage
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    }
    
    // Buscar informações da empresa (em uma aplicação real)
    // Aqui estamos apenas simulando um companyId fixo
  }, []);

  const handleCardClick = (type: string) => {
    console.log(`Clicked ${type}`);
    // Navigate to the connections page for chip-related clicks
    if (['ativos', 'banidos', 'desconectados', 'livres', 'total'].includes(type)) {
      router.push('/connections');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]">
      {/* Sidebar */}
      <div className="w-20 bg-[#38BDF8] flex flex-col items-center py-6 gap-8 shadow-lg">
        <Image src="/images/Logo.png" alt="ChipFlow Logo" width={80} height={80} className="mb-8" />
        <Link href="/dashboard" className="p-3 bg-white/10 rounded-lg transition-all hover:scale-110">
          <Image src="/images/casa.png" alt="Home" width={32} height={32} />
        </Link>
        <Link href="/connections" className="p-3 hover:bg-white/10 rounded-lg transition-all hover:scale-110">
          <Image src="/images/ChipLogo.png" alt="Connections" width={48} height={48} />
        </Link>
        <div className="mt-auto">
          <Link href="/profile" className="p-3 hover:bg-white/10 rounded-lg transition-all hover:scale-110">
            <Image src="/images/user.png" alt="Profile" width={32} height={32} />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12">
        <div className="flex justify-between items-center mb-8 w-full px-0 py-2 border-0 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex space-x-3">
            {token && <UserCreationForm token={token} companyId={companyId} />}
            {/* {token && <QuickUserSetup token={token} />} */}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-10 mb-10">
          {/* Chips Ativos Card */}
          <button 
            onClick={() => handleCardClick('ativos')}
            className="bg-white rounded-[1.5rem] p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform group"
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-grey-600 text-lg font-medium mb-2">Chips Ativos</h3>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <p className="text-5xl font-bold text-green-500">1200</p>
            </div>
          </button>

          {/* Chips Banidos Card */}
          <button 
            onClick={() => handleCardClick('banidos')}
            className="bg-white rounded-[1.5rem] p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform group"
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-grey-600 text-lg font-medium mb-2">Chips Banidos</h3>
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                </div>
              </div>
              <p className="text-5xl font-bold text-red-500">800</p>
            </div>
          </button>

          {/* Chips Desconectados Card */}
          <button 
            onClick={() => handleCardClick('desconectados')}
            className="bg-white rounded-[1.5rem] p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform group"
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-grey-600 text-lg font-medium mb-2">Chips Desconectados</h3>
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                </div>
              </div>
              <p className="text-5xl font-bold text-yellow-500">98</p>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Chips Livres Card */}
          <button 
            onClick={() => handleCardClick('livres')}
            className="bg-white rounded-[1.5rem] p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform group"
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-grey-600 text-lg font-medium mb-2">Chips Livres</h3>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                </div>

              </div>
              <p className="text-5xl font-bold text-blue-500">223</p>
            </div>
          </button>

          {/* Total de Chips Card */}
          <button 
            onClick={() => handleCardClick('total')}
            className="bg-white rounded-[1.5rem] p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform group"
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-grey-600 text-lg font-medium mb-2">Total de Chips</h3>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                </div>
              </div>
              <p className="text-5xl font-bold text-purple-500">2000</p>
            </div>
          </button>
        </div>

        {/* Circular Dashboard Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Status dos Chips</h2>
          <div className="flex items-center justify-between">
            {/* Large Circular Progress */}
            <div className="relative w-64 h-64">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circles */}
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  className="stroke-gray-100"
                  strokeWidth="16"
                />
                {/* Active Chips - Green (60%) */}
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  className="stroke-green-500"
                  strokeWidth="16"
                  strokeDasharray="754"
                  strokeDashoffset="301.6"
                  strokeLinecap="round"
                />
                {/* Banned Chips - Red (30%) */}
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  className="stroke-red-500"
                  strokeWidth="16"
                  strokeDasharray="754"
                  strokeDashoffset="527.8"
                  strokeLinecap="round"
                  transform="rotate(216 128 128)"
                />
                {/* Disconnected Chips - Yellow (10%) */}
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  className="stroke-yellow-500"
                  strokeWidth="16"
                  strokeDasharray="754"
                  strokeDashoffset="678.6"
                  strokeLinecap="round"
                  transform="rotate(324 128 128)"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-5xl font-bold text-gray-800">2000</span>
                <p className="text-gray-600 text-sm">Total de Chips</p>
              </div>
            </div>

            {/* Stats Legend */}
            <div className="flex-1 ml-16 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Chips Ativos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-500">1200</span>
                  <span className="text-gray-500 text-sm">(60%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-gray-600">Chips Banidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-500">800</span>
                  <span className="text-gray-500 text-sm">(30%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600">Chips Desconectados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-yellow-500">98</span>
                  <span className="text-gray-500 text-sm">(10%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">Chips Livres</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-500">223</span>
                  <span className="text-gray-500 text-sm">(11%)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    <span className="text-gray-600">Total de Chips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-purple-500">2000</span>
                    <span className="text-gray-500 text-sm">(100%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
