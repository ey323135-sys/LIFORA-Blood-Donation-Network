import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/authService';
import { Bot, Send, Loader2, BookOpen, AlertCircle, Zap, MessageSquare, ChevronDown } from 'lucide-react';

const SAMPLE_QUERIES = [
  'Which blood group is the universal donor?',
  'What are the eligibility requirements for blood donation?',
  'How does organ donation consent work?',
  'What blood types are compatible with B+ positive?',
  'What is the minimum weight requirement to donate blood?',
  'How often can I donate blood?',
  'What is the hospital SOP for emergency blood requests?',
];

export default function AIAssistant() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'system',
      text: 'Welcome to the LIFORA Medical Knowledge Assistant. Ask any question about blood donation, blood group compatibility, organ donation, or hospital procedures. All answers are sourced from approved medical reference documents.',
      sources: []
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuery = async (q) => {
    const queryText = (q || query).trim();
    if (!queryText) return;

    const userMessage = { type: 'user', text: queryText, sources: [] };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const res = await aiService.query(queryText);
      const aiMessage = {
        type: 'ai',
        text: res.answer,
        sources: res.sources || [],
        confidence: res.confidence || 'Moderate'
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        type: 'error',
        text: err.message || 'Failed to get response. Please try again.',
        sources: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-violet-600/30">
          <Bot className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">LIFORA Medical Knowledge Assistant</h1>
        <p className="text-slate-400 text-sm">Powered by RAG – Retrieval-Augmented Generation from approved medical documents</p>
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-200/80 text-xs leading-relaxed">
          <strong>Medical Disclaimer:</strong> Information provided is sourced from LIFORA's approved reference documents for awareness and coordination purposes only.
          This assistant is <strong>NOT</strong> a substitute for professional medical advice, diagnosis, or clinical blood safety decisions.
          Always consult qualified medical professionals and certified blood bank personnel for clinical decisions.
        </p>
      </div>

      {/* Quick Sample Queries */}
      <div>
        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-violet-400" /> Try a sample question:
        </p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUERIES.slice(0, 4).map((q, i) => (
            <button key={i} onClick={() => handleQuery(q)}
              className="text-xs px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 transition-colors">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="glass-panel p-0 overflow-hidden">
        <div className="h-[420px] overflow-y-auto p-6 space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`space-y-2 ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
              {msg.type === 'user' && (
                <div className="max-w-[80%] bg-red-600/20 border border-red-500/30 rounded-2xl rounded-tr-sm px-4 py-3">
                  <p className="text-sm text-white">{msg.text}</p>
                </div>
              )}

              {(msg.type === 'ai' || msg.type === 'system') && (
                <div className="max-w-[90%] space-y-3">
                  <div className={`flex items-start gap-3`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${msg.type === 'system' ? 'bg-slate-700' : 'bg-violet-600'}`}>
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className={`rounded-2xl rounded-tl-sm px-4 py-3 ${msg.type === 'system' ? 'bg-slate-800/80 border border-slate-700' : 'bg-violet-500/10 border border-violet-500/20'}`}>
                      <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">{msg.text}</pre>
                      {msg.confidence && (
                        <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border ${
                          msg.confidence === 'High' 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          Confidence: {msg.confidence}
                        </span>
                      )}
                    </div>
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="ml-10">
                      <details className="group">
                        <summary className="text-[11px] text-slate-500 cursor-pointer flex items-center gap-1 hover:text-slate-400">
                          <BookOpen className="w-3 h-3" />
                          {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''} referenced
                          <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="mt-2 space-y-1.5">
                          {msg.sources.map((src, si) => (
                            <div key={si} className="text-[11px] p-2 rounded-lg bg-slate-800/60 border border-slate-700">
                              <p className="text-violet-300 font-medium">{src.title}</p>
                              <p className="text-slate-500">{src.category}</p>
                              <p className="text-slate-400 mt-0.5">{src.summary}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}

              {msg.type === 'error' && (
                <div className="max-w-[80%] bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{msg.text}</p>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                <span className="text-sm text-slate-400">Searching knowledge base...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <MessageSquare className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
              <textarea
                rows={1}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about blood donation, compatibility, organ donation..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
              />
            </div>
            <button
              onClick={() => handleQuery()}
              disabled={loading || !query.trim()}
              className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Ask
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-1.5 text-center">
            Press Enter to submit · Shift+Enter for new line · Sources cited below each answer
          </p>
        </div>
      </div>
    </div>
  );
}
