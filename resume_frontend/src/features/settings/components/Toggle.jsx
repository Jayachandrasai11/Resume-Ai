import React from 'react';

const Toggle = ({ checked, onChange }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${checked ? 'bg-indigo-600 shadow-[0_0_12px_rgba(79,140,255,0.3)]' : 'bg-slate-800 border border-white/10'}`}
  >
    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${checked ? 'translate-x-6' : ''}`} />
  </button>
);

export default Toggle;
