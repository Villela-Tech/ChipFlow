'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { apiService } from '@/services/api';

interface DashboardStats {
  totalChips: number;
  activeChips: number;
  inactiveChips: number;
  jusConnections: number;
  vbsenderConnections: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalChips: 0,
    activeChips: 0,
    inactiveChips: 0,
    jusConnections: 0,
    vbsenderConnections: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [filteredStats, setFilteredStats] = useState<DashboardStats>(stats);
  const [_error, _setError] = useState<string | null>(null);
  
  const VB_EMAIL = process.env.NEXT_PUBLIC_VB_EMAIL;
  const VB_PASSWORD = process.env.NEXT_PUBLIC_VB_PASSWORD;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!VB_EMAIL || !VB_PASSWORD) {
          throw new Error('Credenciais não configuradas. Verifique as variáveis de ambiente.');
        }

        const { jusToken, vbsenderToken } = await apiService.login(VB_EMAIL, VB_PASSWORD);
        const connections = await apiService.getWhatsAppConnections(jusToken, vbsenderToken);
        
        const newStats = {
          totalChips: connections.length,
          activeChips: connections.filter(c => c.status.toLowerCase() === 'connected').length,
          inactiveChips: connections.filter(c => c.status.toLowerCase() !== 'connected').length,
          jusConnections: connections.filter(c => c.source === 'jus').length,
          vbsenderConnections: connections.filter(c => c.source === 'vbsender').length
        };
        
        setStats(newStats);
        setFilteredStats(newStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        _setError(error instanceof Error ? error.message : 'Erro ao carregar os dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [VB_EMAIL, VB_PASSWORD]);

  useEffect(() => {
    // Apply filters to stats
    let filteredData = { ...stats };

    if (statusFilter !== 'all' || sourceFilter !== 'all') {
      const activeMultiplier = statusFilter === 'active' ? 1 : statusFilter === 'inactive' ? 0 : 1;
      const inactiveMultiplier = statusFilter === 'inactive' ? 1 : statusFilter === 'active' ? 0 : 1;
      const jusMultiplier = sourceFilter === 'jus' ? 1 : sourceFilter === 'vbsender' ? 0 : 1;
      const vbsenderMultiplier = sourceFilter === 'vbsender' ? 1 : sourceFilter === 'jus' ? 0 : 1;

      filteredData = {
        ...stats,
        activeChips: stats.activeChips * activeMultiplier,
        inactiveChips: stats.inactiveChips * inactiveMultiplier,
        jusConnections: stats.jusConnections * jusMultiplier,
        vbsenderConnections: stats.vbsenderConnections * vbsenderMultiplier,
        totalChips: 
          (stats.activeChips * activeMultiplier + stats.inactiveChips * inactiveMultiplier) *
          (sourceFilter === 'all' ? 1 : 0) +
          (stats.jusConnections * jusMultiplier + stats.vbsenderConnections * vbsenderMultiplier) *
          (statusFilter === 'all' ? 1 : 0)
      };
    }

    setFilteredStats(filteredData);
  }, [statusFilter, sourceFilter, stats]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

          {/* Filter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Status Filter */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtrar por Status</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="status"
                    value="all"
                    checked={statusFilter === 'all'}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-radio h-4 w-4 text-blue-500"
                  />
                  <span className="text-gray-700">Todos os Status</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={statusFilter === 'active'}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-radio h-4 w-4 text-green-500"
                  />
                  <span className="text-gray-700">Ativos</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={statusFilter === 'inactive'}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-radio h-4 w-4 text-red-500"
                  />
                  <span className="text-gray-700">Inativos</span>
                </label>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Status Selecionado:</span>
                  <span className={`font-medium px-2 py-1 rounded-full ${
                    statusFilter === 'active' ? 'bg-green-100 text-green-800' :
                    statusFilter === 'inactive' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {statusFilter === 'active' ? 'Ativos' :
                     statusFilter === 'inactive' ? 'Inativos' :
                     'Todos'}
                  </span>
                </div>
              </div>
            </div>

            {/* Source Filter */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtrar por Origem</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="source"
                    value="all"
                    checked={sourceFilter === 'all'}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="form-radio h-4 w-4 text-blue-500"
                  />
                  <span className="text-gray-700">Todas as Origens</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="source"
                    value="jus"
                    checked={sourceFilter === 'jus'}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="form-radio h-4 w-4 text-blue-500"
                  />
                  <span className="text-gray-700">JUS</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="source"
                    value="vbsender"
                    checked={sourceFilter === 'vbsender'}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="form-radio h-4 w-4 text-purple-500"
                  />
                  <span className="text-gray-700">VBSender</span>
                </label>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Origem Selecionada:</span>
                  <span className={`font-medium px-2 py-1 rounded-full ${
                    sourceFilter === 'jus' ? 'bg-blue-100 text-blue-800' :
                    sourceFilter === 'vbsender' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {sourceFilter === 'jus' ? 'JUS' :
                     sourceFilter === 'vbsender' ? 'VBSender' :
                     'Todas'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo dos Filtros</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total Filtrado</p>
                  <p className="text-2xl font-bold text-gray-800">{filteredStats.totalChips}</p>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Distribuição</p>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ativos</span>
                      <span className="font-medium text-green-600">
                        {((filteredStats.activeChips / (filteredStats.totalChips || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Inativos</span>
                      <span className="font-medium text-red-600">
                        {((filteredStats.inactiveChips / (filteredStats.totalChips || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total de Chips</p>
                  <h2 className="text-3xl font-bold text-gray-800">{filteredStats.totalChips}</h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Chips Ativos</p>
                  <h2 className="text-3xl font-bold text-gray-800">{filteredStats.activeChips}</h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500"></div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Chips Inativos</p>
                  <h2 className="text-3xl font-bold text-gray-800">{filteredStats.inactiveChips}</h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500"></div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição de Status</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                      Ativos
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-green-600">
                      {((filteredStats.activeChips / (filteredStats.totalChips || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                  <div style={{ width: `${(filteredStats.activeChips / (filteredStats.totalChips || 1)) * 100}%` }}
                       className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500">
                  </div>
                </div>
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                      Inativos
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-red-600">
                      {((filteredStats.inactiveChips / (filteredStats.totalChips || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-red-200">
                  <div style={{ width: `${(filteredStats.inactiveChips / (filteredStats.totalChips || 1)) * 100}%` }}
                       className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500">
                  </div>
                </div>
              </div>
            </div>

            {/* Source Distribution */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição por Origem</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      JUS
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {((filteredStats.jusConnections / (filteredStats.totalChips || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div style={{ width: `${(filteredStats.jusConnections / (filteredStats.totalChips || 1)) * 100}%` }}
                       className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500">
                  </div>
                </div>
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                      VBSender
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-purple-600">
                      {((filteredStats.vbsenderConnections / (filteredStats.totalChips || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                  <div style={{ width: `${(filteredStats.vbsenderConnections / (filteredStats.totalChips || 1)) * 100}%` }}
                       className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
