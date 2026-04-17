import React, { useState, useRef, useEffect } from 'react';
import { api, asList, http } from '../services/api';

const ResumeChat = () => {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const messagesEndRef = useRef(null);

  // Load saved messages from localStorage when candidate changes
  useEffect(() => {
    if (selectedCandidateId) {
      const savedMessages = localStorage.getItem(`chat_messages_${selectedCandidateId}`);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed);
        } catch (e) {
          console.error('Error loading saved messages:', e);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [selectedCandidateId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (selectedCandidateId && messages.length > 0) {
      localStorage.setItem(`chat_messages_${selectedCandidateId}`, JSON.stringify(messages));
    }
  }, [messages, selectedCandidateId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await api.listCandidates();
        setCandidates(asList(response.data));
      } catch (err) {
        console.error('Error fetching candidates:', err);
        setCandidates([]);
      }
    };
    fetchCandidates();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || !selectedCandidateId || loading) return;

    const userMessage = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await http.post('/candidates/chat/', { 
        candidate_id: selectedCandidateId,
        question: query 
      });
      const aiMessage = { role: 'assistant', content: response.data.answer || response.data.response || response.data.message || 'No response from AI.' };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error in resume chat:', err);
      const errorMessage = { role: 'error', content: 'Failed to get response. Please try again.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Clear chat for current candidate
  const handleClearChat = () => {
    if (selectedCandidateId && window.confirm('Clear chat history for this candidate?')) {
      localStorage.removeItem(`chat_messages_${selectedCandidateId}`);
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] glass-card rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">
            Resume <span className="text-indigo-500">Intelligence</span> Chat
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Ask automated neural questions about candidate datasets.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-64 z-[100]" tabIndex={0} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) document.getElementById('dropdown-trigger')?.blur(); }}>
            <button 
              id="dropdown-trigger"
              type="button"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium flex items-center justify-between group"
              onClick={(e) => {
                 const list = e.currentTarget.nextElementSibling;
                 if (list.classList.contains('hidden')) { list.classList.remove('hidden'); } else { list.classList.add('hidden'); }
              }}
            >
              <span className="truncate">
                {selectedCandidateId 
                  ? (candidates.find(c => c.id.toString() === selectedCandidateId.toString())?.name || `Candidate #${selectedCandidateId}`)
                  : 'Select a Candidate'}
              </span>
              <svg className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div className="hidden absolute top-full left-0 mt-2 w-full bg-[#050a1f] border border-white/10 rounded-xl shadow-2xl shadow-indigo-500/10 overflow-hidden z-[100]">
              <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500/50 scrollbar-track-transparent">
                <button
                  type="button"
                  className={`w-full text-left px-4 py-3 text-sm text-slate-400 hover:bg-white/5 transition-all font-medium border-b border-white/5 ${!selectedCandidateId ? 'bg-indigo-600/10 text-indigo-400' : ''}`}
                  onClick={(e) => { setSelectedCandidateId(''); e.currentTarget.parentElement.parentElement.classList.add('hidden'); }}
                >
                  Clear Selection
                </button>
                {candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    className={`w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-all font-medium ${selectedCandidateId === candidate.id.toString() ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'}`}
                    onClick={(e) => { setSelectedCandidateId(candidate.id.toString()); e.currentTarget.parentElement.parentElement.classList.add('hidden'); }}
                  >
                    {candidate.name || candidate.email || `Candidate #${candidate.id}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {selectedCandidateId && messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="px-4 py-3 bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl border border-white/5 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
              title="Clear chat history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/50 scrollbar-thin border-indigo-500/10 shadow-inner">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="glass-card p-10 rounded-3xl max-w-md border-indigo-500/20 shadow-2xl shadow-indigo-500/5 bg-slate-900/80">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-white/5 flex items-center justify-center glow-purple">
                <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase mb-2">Start a conversation</h3>
              {!selectedCandidateId ? (
                <p className="text-[11px] font-black tracking-widest text-amber-500/80 uppercase">Please select a candidate above to start chatting.</p>
              ) : (
                <p className="text-xs font-bold text-slate-500">Try asking: "What are their top skills?" or "Summarize their work experience."</p>
              )}
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-lg ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none border border-indigo-500/50 shadow-indigo-500/20'
                  : msg.role === 'error'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-tl-none'
                  : 'bg-slate-900/80 backdrop-blur-md border border-white/5 text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-2xl rounded-tl-none px-5 py-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/5">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            className="flex-1 w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
            placeholder={selectedCandidateId ? "Type your question here..." : "Select a candidate first"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading || !selectedCandidateId}
          />
          <button
            type="submit"
            className={`bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 px-6 py-3 ${
              loading ? 'opacity-70 cursor-wait' : ''
            }`}
             disabled={loading || !selectedCandidateId}
          >
            {loading ? 'Thinking...' : (
              <>
                Send
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResumeChat;
