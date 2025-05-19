interface DashboardStatsProps {
  connections: Array<{
    status: string;
  }>;
}

export default function DashboardStats({ connections }: DashboardStatsProps) {
  const totalChips = connections.length;
  const activeChips = connections.filter(conn => 
    conn.status.toLowerCase() === 'connected'
  ).length;
  const inactiveChips = totalChips - activeChips;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total de Chips */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-500">Total de Chips</h2>
            <p className="text-2xl font-semibold text-gray-700">{totalChips}</p>
          </div>
        </div>
      </div>

      {/* Chips Ativos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-full">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-500">Chips Ativos</h2>
            <p className="text-2xl font-semibold text-gray-700">{activeChips}</p>
          </div>
        </div>
      </div>

      {/* Chips Inativos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <div className="p-3 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-500">Chips Inativos</h2>
            <p className="text-2xl font-semibold text-gray-700">{inactiveChips}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 