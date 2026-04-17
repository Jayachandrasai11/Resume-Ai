import React from 'react';

const DashboardPreview = () => {
  return (
    <div className="mt-20 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/60 to-blue-200/60 rounded-[40px] opacity-70 transform group-hover:scale-[1.02] transition-transform duration-300"></div>
      {/* Reduced blur for better performance */}
      <div className="relative bg-white/90 border border-slate-200/70 rounded-[40px] shadow-[0_24px_48px_-18px_rgba(0,0,0,0.12)] p-6 overflow-hidden">
         <div className="bg-slate-50 rounded-[32px] overflow-hidden border border-slate-200/60 min-h-[500px] flex flex-col">
            {/* Mock Dashboard Header */}
            <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                  <div className="h-4 w-32 bg-slate-100 rounded-full"></div>
              </div>
              <div className="flex space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </div>
              </div>
            </div>

            {/* Mock Dashboard Content */}
            <div className="p-8 flex-1 grid grid-cols-12 gap-6">
              {/* Stats */}
              <div className="col-span-12 grid grid-cols-3 gap-6 mb-2">
                  {[
                      { label: 'Total Candidates', value: '124', color: 'bg-indigo-600', trend: '+12%' },
                      { label: 'Active Jobs', value: '8', color: 'bg-purple-600', trend: 'Stable' },
                      { label: 'Shortlisted', value: '32', color: 'bg-blue-600', trend: '+5%' }
                  ].map((stat, i) => (
                      <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition">
                          <div className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">{stat.label}</div>
                          <div className="flex items-end justify-between">
                              <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                              <div className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend.includes('+') ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'}`}>
                                  {stat.trend}
                              </div>
                          </div>
                          <div className={`h-1.5 w-full ${stat.color} opacity-10 rounded-full mt-4`}>
                              <div className={`h-full ${stat.color} rounded-full`} style={{width: i === 0 ? '70%' : i === 1 ? '40%' : '85%'}}></div>
                          </div>
                      </div>
                  ))}
              </div>

              {/* Table Preview */}
              <div className="col-span-8 bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-black text-slate-800">Recent Applications</h3>
                      <button className="text-indigo-600 font-bold text-sm">View All</button>
                  </div>
                  <table className="w-full text-left">
                      <thead>
                          <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                              <th className="px-6 py-4">Name</th>
                              <th className="px-6 py-4">Role</th>
                              <th className="px-6 py-4">Match</th>
                              <th className="px-6 py-4">Status</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm">
                          {[
                              { name: 'Rahul Sharma', role: 'React Developer', match: '92%', status: 'Interview', color: 'indigo' },
                              { name: 'Anita Singh', role: 'Python Developer', match: '88%', status: 'Screening', color: 'blue' },
                              { name: 'James Wilson', role: 'UI Designer', match: '85%', status: 'New', color: 'purple' }
                          ].map((row, i) => (
                              <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                                  <td className="px-6 py-4 font-bold text-slate-700">{row.name}</td>
                                  <td className="px-6 py-4 text-slate-500">{row.role}</td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center">
                                          <div className="w-12 bg-slate-100 h-1.5 rounded-full mr-3">
                                              <div className="bg-indigo-500 h-full rounded-full" style={{width: row.match}}></div>
                                          </div>
                                          <span className="font-black text-indigo-600">{row.match}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${row.color}-50 text-${row.color}-600`}>
                                          {row.status}
                                      </span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              {/* Pipeline */}
              <div className="col-span-4 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6">
                  <h3 className="font-black text-slate-800 mb-6">Hiring Pipeline</h3>
                  <div className="space-y-6">
                      {[
                          { label: 'Applied', count: 50, color: 'indigo' },
                          { label: 'Interview', count: 20, color: 'purple' },
                          { label: 'Selected', count: 5, color: 'blue' }
                      ].map((item, i) => (
                          <div key={i}>
                              <div className="flex justify-between text-sm font-bold mb-2">
                                  <span className="text-slate-500">{item.label}</span>
                                  <span className="text-slate-900">{item.count}</span>
                              </div>
                              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full bg-${item.color}-500 rounded-full`} style={{width: `${(item.count/50)*100}%`}}></div>
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                      <p className="text-xs font-bold text-indigo-700">Efficiency up 24% this month!</p>
                  </div>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
