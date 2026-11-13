export function StatSkeleton() {
  return (
    <div className="rounded-xl bg-[#2E8B7A]/80 p-5 shadow-sm w-full h-[160px] flex flex-col justify-between animate-pulse">
      <div className="flex justify-between items-start">
        <div className="w-24 h-3 bg-white/20 rounded"></div>
        <div className="w-6 h-6 bg-white/20 rounded-lg"></div>
      </div>
      <div className="w-32 h-12 bg-white/30 rounded mt-2"></div>
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="w-16 h-3 bg-white/20 rounded"></div>
      </div>
    </div>
  );
}

export function ZoneSkeleton() {
  return (
    <div className="p-5 bg-white border border-slate-200 rounded-[14px] shadow-sm w-full animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="w-24 h-5 bg-slate-100 rounded"></div>
        <div className="w-16 h-4 bg-slate-50 rounded"></div>
      </div>
      
      <div className="mb-6">
        <div className="w-20 h-2 bg-slate-50 rounded mb-2"></div>
        <div className="w-28 h-10 bg-slate-100 rounded"></div>
      </div>
      
      <div className="h-2 w-full bg-slate-50 rounded-full mb-6"></div>
      
      <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between">
        <div className="w-20 h-3 bg-slate-50 rounded"></div>
        <div className="w-24 h-3 bg-slate-100 rounded"></div>
      </div>
    </div>
  );
}

export default function SkeletonCard({ lines = 4, hasChart = false }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm w-full border border-slate-100 animate-pulse">
      <div className="flex justify-between items-start mb-6">
        <div className="w-1/3 h-6 bg-slate-100 rounded"></div>
        <div className="w-12 h-6 bg-slate-50 rounded-full"></div>
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-50 rounded w-full"></div>
        ))}
      </div>

      {hasChart && (
        <div className="mt-6 h-[200px] bg-slate-50 rounded-xl w-full"></div>
      )}
    </div>
  );
}
