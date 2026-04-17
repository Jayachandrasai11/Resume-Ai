import React from 'react';

const Navigation = ({ onNavigate }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-brand-dark/95 backdrop-blur-md z-50 border-b border-brand-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mr-3 shadow-lg group-hover:rotate-6 transition-transform">R</div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Recruiter AI</span>
          </div>
          <div className="hidden md:flex items-center space-x-10">
            <a href="#features" className="text-brand-text-secondary hover:text-brand-primary transition font-medium">Features</a>
            <a href="#workflow" className="text-brand-text-secondary hover:text-brand-primary transition font-medium">Workflow</a>
            <a href="#benefits" className="text-brand-text-secondary hover:text-brand-primary transition font-medium">Benefits</a>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => onNavigate('/login')}
              className="px-4 py-2 text-brand-text-secondary hover:text-brand-primary transition font-semibold"
            >
              {/* 🚀 THE RECRUITER AI INTELLIGENCE SYSTEM 🚀 */}
              Login
            </button>
            <button 
              onClick={() => onNavigate('/login')}
              className="px-8 py-3 bg-gradient-to-r from-brand-primary to-blue-600 text-white rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-brand-primary/20 font-bold"
            >
              Launch Intelligence
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
