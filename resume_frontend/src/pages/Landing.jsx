import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Landing/Navigation';
import Hero from '../components/Landing/Hero';

// Lazy load components that are below the fold for faster initial load
const Features = lazy(() => import('../components/Landing/Features'));
const Workflow = lazy(() => import('../components/Landing/Workflow'));
const Benefits = lazy(() => import('../components/Landing/Benefits'));
const CTA = lazy(() => import('../components/Landing/CTA'));
const Footer = lazy(() => import('../components/Landing/Footer'));

// Advanced Lazy Loading Wrapper using Intersection Observer with motion
const LazySection = ({ children, height = '400px', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '100px' }); 

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: isVisible ? 'auto' : height }}>
      <Suspense fallback={<div className="h-40 bg-slate-50 animate-pulse" />}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1],
            delay: delay
          }}
          viewport={{ once: true, margin: "-100px" }}
        >
          {children}
        </motion.div>
      </Suspense>
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // Redirect logic is now handled in EntryRoute component
    // This keeps Landing page clean and focused on presentation
  }, [isAuthenticated, user, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-indigo-100 scroll-smooth">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 origin-left z-[100]"
        style={{ scaleX }}
      />
      <Navigation onNavigate={navigate} />
      <Hero onNavigate={navigate} />
      
      <div className="h-16 bg-white"></div>

      <LazySection height="600px">
        <Features />
      </LazySection>
      
      <div className="h-16 bg-white"></div>

      <LazySection height="600px">
        <Workflow />
      </LazySection>
      
      <div className="h-16 bg-slate-50"></div>

      <LazySection height="600px">
        <Benefits />
      </LazySection>
      
      <div className="h-16 bg-slate-50"></div>

      <LazySection height="300px">
        <CTA onNavigate={navigate} />
      </LazySection>
      
      <LazySection height="200px">
        <Footer />
      </LazySection>
    </div>
  );
};

export default Landing;
