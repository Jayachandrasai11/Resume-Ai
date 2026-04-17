import React from 'react';

const Workflow = () => {
  return (
    <section id="workflow" className="py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">The Future of Hiring Workflow</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-xl">From initial application to final offer, streamlined by AI.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {[
            { step: '01', title: 'Smart Upload', desc: 'Drag-and-drop resumes or connect your Gmail inbox for auto-sync.' },
            { step: '02', title: 'AI Extraction', desc: 'Our engine identifies skills, education, and professional milestones.' },
            { step: '03', title: 'Match Ranking', desc: 'Candidates are ranked 0-100% against your specific requirements.' },
            { step: '04', title: 'Instant Hire', desc: 'Shortlist the best talent and move to interviews in record time.' }
          ].map((item, idx) => (
            <div key={idx} className="relative group">
              <div className="text-8xl font-black text-indigo-50 mb-6 group-hover:text-indigo-100 transition-colors">{item.step}</div>
              <div className="absolute top-10 left-0">
                  <h3 className="text-2xl font-black mb-4 text-slate-800">{item.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Workflow;
