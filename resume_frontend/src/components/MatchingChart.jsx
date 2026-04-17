import React from 'react';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const MatchingChart = ({ title = 'AI Matching Score Distribution', bins, color = '#4f46e5' }) => {
  const items = Array.isArray(bins) ? bins : [];
  const max = items.reduce(
    (acc, b) => Math.max(acc, Number(b?.count) || 0),
    1
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
          Histogram
        </span>
      </div>
      <div className="p-6">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">No data available.</p>
        ) : (
          <div className="flex items-end justify-between gap-1 h-40">
            {items.map((bin, idx) => {
              const count = Number(bin?.count) || 0;
              const pct = clamp((count / max) * 100, 4, 100);
              const labelStart = Math.round((bin?.bin_start || 0) * 100);
              const labelEnd = Math.round((bin?.bin_end || 0) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 via-indigo-400 to-sky-400 transition-all duration-500"
                    style={{ height: `${pct}%` }}
                    title={`${labelStart}-${labelEnd} : ${count}`}
                  />
                  <span className="text-[9px] text-gray-400 font-medium">
                    {labelStart}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchingChart;

