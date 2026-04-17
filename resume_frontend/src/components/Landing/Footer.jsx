import React from 'react';

const Footer = () => {
  return (
    <footer className="py-20 bg-brand-darker border-t border-brand-border px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-brand-text-secondary">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">R</div>
            <span className="text-2xl font-black text-brand-text-primary">ResumeIntel</span>
          </div>
          <p className="text-lg font-medium max-w-sm leading-relaxed mb-8">
            The next generation AI platform for automated resume parsing, semantic ranking, and talent intelligence.
          </p>
          <div className="flex space-x-6">
              {[
                { name: 'Twitter', url: 'https://twitter.com/resumeintel', icon: (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                )},
                { name: 'LinkedIn', url: 'https://linkedin.com/company/resumeintel', icon: (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.2225 0h.003z"/></svg>
                )},
                { name: 'Facebook', url: 'https://facebook.com/resumeintel', icon: (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                )}
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-brand-card border border-brand-border flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all duration-300 hover:scale-110 shadow-lg"
                >
                  {social.icon}
                </a>
              ))}
          </div>
        </div>
        <div>
          <h5 className="text-brand-text-primary font-black mb-6 uppercase text-sm tracking-widest">Product</h5>
          <ul className="space-y-4 font-bold">
            <li><a href="#features" className="hover:text-brand-primary transition">Features</a></li>
            <li><a href="#workflow" className="hover:text-brand-primary transition">Workflow</a></li>
            <li><a href="#benefits" className="hover:text-brand-primary transition">Benefits</a></li>
            <li><a href="#" className="hover:text-brand-primary transition">Pricing</a></li>
          </ul>
        </div>
        <div>
          <h5 className="text-brand-text-primary font-black mb-6 uppercase text-sm tracking-widest">Company</h5>
          <ul className="space-y-4 font-bold">
            <li><a href="#" className="hover:text-brand-primary transition">About Us</a></li>
            <li><a href="#" className="hover:text-brand-primary transition">Careers</a></li>
            <li><a href="#" className="hover:text-brand-primary transition">Privacy</a></li>
            <li><a href="#" className="hover:text-brand-primary transition">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-brand-border text-center font-bold text-brand-text-secondary/40 text-sm">
        © {new Date().getFullYear()} ResumeIntel. Engineered for excellence.
      </div>
    </footer>
  );
};

export default Footer;
