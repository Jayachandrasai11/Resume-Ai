import React, { useMemo } from 'react';

function scorePassword(pwd) {
  const p = String(pwd || '');
  if (!p) return { score: 0, label: 'weak' };

  let score = 0;
  if (p.length >= 8) score += 1;
  if (/[A-Z]/.test(p)) score += 1;
  if (/[0-9]/.test(p)) score += 1;
  if (/[^A-Za-z0-9]/.test(p)) score += 1;

  const label = score >= 4 ? 'strong' : score >= 2 ? 'medium' : 'weak';
  return { score, label };
}

export default function PasswordStrength({ password }) {
  const { score, label } = useMemo(() => scorePassword(password), [password]);

  if (!password) return null;

  const pct = (score / 4) * 100;
  const barColor =
    label === 'strong' ? 'bg-green-600' : label === 'medium' ? 'bg-yellow-500' : 'bg-red-500';
  const textColor =
    label === 'strong' ? 'text-green-700' : label === 'medium' ? 'text-yellow-700' : 'text-red-600';

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">Password strength</span>
        <span className={`text-xs font-semibold capitalize ${textColor}`}>{label}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

