export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-[#38BDF8] flex">
      <div className="flex-1 flex flex-col justify-start px-16 lg:px-24 pt-14">
        <div className="animate-pulse bg-white/20 h-[83px] w-[83px] rounded-lg mb-24" />
        <div className="animate-pulse bg-white/20 h-24 w-3/4 rounded-lg mb-6" />
        <div className="animate-pulse bg-white/20 h-4 w-48 rounded-lg" />
      </div>
      
      <div className="flex-1 bg-white rounded-l-[2.5rem] shadow-lg flex items-center">
        <div className="w-full max-w-md mx-auto px-16">
          <div className="animate-pulse bg-gray-200 h-12 w-32 rounded-lg mb-20" />
          
          <div className="space-y-10">
            <div>
              <div className="animate-pulse bg-gray-200 h-4 w-16 rounded mb-2" />
              <div className="animate-pulse bg-gray-200 h-10 w-full rounded" />
            </div>
            
            <div>
              <div className="animate-pulse bg-gray-200 h-4 w-16 rounded mb-2" />
              <div className="animate-pulse bg-gray-200 h-10 w-full rounded" />
            </div>
            
            <div className="flex items-center justify-center pt-6">
              <div className="animate-pulse bg-gray-200 h-px w-full" />
              <div className="animate-pulse bg-gray-200 h-4 w-8 mx-8 rounded" />
              <div className="animate-pulse bg-gray-200 h-px w-full" />
            </div>
            
            <div className="text-center">
              <div className="animate-pulse bg-gray-200 h-4 w-48 mx-auto rounded" />
            </div>
            
            <div className="animate-pulse bg-gray-200 h-12 w-full rounded-md mt-8" />
          </div>
        </div>
      </div>
    </div>
  );
} 