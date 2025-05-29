'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/debug')
      .then(res => res.json())
      .then(data => {
        setDebugInfo(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug - Configuração do Banco de Dados</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Variáveis de Ambiente</h2>
        <pre className="text-sm">{JSON.stringify(debugInfo?.environment, null, 2)}</pre>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Status do Banco de Dados</h2>
        <p><strong>Status:</strong> <span className={debugInfo?.database?.status === 'CONNECTED' ? 'text-green-600' : 'text-red-600'}>{debugInfo?.database?.status}</span></p>
        <p><strong>Tabelas:</strong> {debugInfo?.database?.tables?.length || 0}</p>
        {debugInfo?.database?.tables?.length > 0 && (
          <ul className="list-disc ml-6 mt-2">
            {debugInfo.database.tables.map((table: string, index: number) => (
              <li key={index}>{table}</li>
            ))}
          </ul>
        )}
      </div>

      {debugInfo?.database?.error && (
        <div className="bg-red-100 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-3 text-red-800">Erro de Conexão</h2>
          <p><strong>Mensagem:</strong> {debugInfo.database.error}</p>
          
          {debugInfo?.database?.errorDetails && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Detalhes do Erro:</h3>
              <pre className="text-sm bg-red-50 p-3 rounded overflow-x-auto">
                {JSON.stringify(debugInfo.database.errorDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Soluções Possíveis</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Verificar se o MySQL está rodando na porta 3307</li>
          <li>Verificar se o banco de dados "chipflow" existe</li>
          <li>Verificar se as credenciais estão corretas</li>
          <li>Verificar se há firewall bloqueando a conexão</li>
        </ul>
      </div>
    </div>
  );
} 