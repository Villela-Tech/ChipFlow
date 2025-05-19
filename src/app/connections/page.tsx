'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { apiService } from '@/services/api';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';

interface WhatsAppConnection {
  name: string;
  companyName: string;
  number: string;
  status: string;
  source: 'jus' | 'vbsender';
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'jus' | 'vbsender'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { jusToken, vbsenderToken } = await apiService.login('admin@admin.com', '123456');
        const data = await apiService.getWhatsAppConnections(jusToken, vbsenderToken);
        setConnections(data);
      } catch (err) {
        setError('Erro ao carregar as conexões. Por favor, tente novamente.');
        console.error('Error fetching connections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Memoized filtering logic
  const filteredConnections = useMemo(() => {
    return connections.filter(connection => {
      const matchesSearch = searchText.trim() === '' || 
        connection.name.toLowerCase().includes(searchText.toLowerCase()) ||
        connection.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
        connection.status.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'connected' ? connection.status.toLowerCase() === 'connected' : connection.status.toLowerCase() === 'disconnected');

      const matchesSource = sourceFilter === 'all' || connection.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [connections, searchText, statusFilter, sourceFilter]);

  // Debounced search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
  }, []);

  const getStats = useMemo(() => {
    return {
      total: connections.length,
      jus: connections.filter(c => c.source === 'jus').length,
      vbsender: connections.filter(c => c.source === 'vbsender').length
    };
  }, [connections]);

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

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const stats = getStats;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">Conexões WhatsApp</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Connections */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div className="relative z-10">
                  <p className="text-sm text-gray-600 font-medium">Total de Conexões</p>
                  <h2 className="text-4xl font-bold mt-2 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    {stats.total}
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-blue-400"></div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-100 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500"></div>
            </div>

            {/* JUS Connections */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div className="relative z-10">
                  <p className="text-sm text-gray-600 font-medium">Conexões JUS</p>
                  <h2 className="text-4xl font-bold mt-2 bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                    {stats.jus}
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-100 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500"></div>
            </div>

            {/* VBSender Connections */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div className="relative z-10">
                  <p className="text-sm text-gray-600 font-medium">Conexões VBSender</p>
                  <h2 className="text-4xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                    {stats.vbsender}
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 to-purple-400"></div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-100 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Search Filter */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filtrar por nome, empresa ou status..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  value={searchText}
                  onChange={handleSearchChange}
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Status</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium flex-1 transition-all duration-300 ${
                    statusFilter === 'all'
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('connected')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium flex-1 transition-all duration-300 ${
                    statusFilter === 'connected'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Conectados
                </button>
                <button
                  onClick={() => setStatusFilter('disconnected')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium flex-1 transition-all duration-300 ${
                    statusFilter === 'disconnected'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Desconectados
                </button>
              </div>
            </div>

            {/* Source Filter */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Origem</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSourceFilter('all')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium flex-1 transition-all duration-300 ${
                    sourceFilter === 'all'
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setSourceFilter('jus')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium flex-1 transition-all duration-300 ${
                    sourceFilter === 'jus'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  JUS
                </button>
                <button
                  onClick={() => setSourceFilter('vbsender')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium flex-1 transition-all duration-300 ${
                    sourceFilter === 'vbsender'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  VBSender
                </button>
              </div>
            </div>
          </div>

          {/* Connections Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Número</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredConnections.map((connection, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {connection.name === 'Atendimento' ? (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <span className="text-lg">📞</span>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-gray-600">
                                {connection.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">{connection.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{connection.companyName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{connection.number || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 text-xs font-medium rounded-full inline-flex items-center ${
                          connection.status.toLowerCase() === 'connected'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            connection.status.toLowerCase() === 'connected'
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}></span>
                          {connection.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                          connection.source === 'jus'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {connection.source.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 



