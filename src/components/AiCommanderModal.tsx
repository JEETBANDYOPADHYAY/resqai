import React, { useState } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  AlertTriangle,
  Compass,
  Building2,
  CloudRain,
  Zap,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { SensorTelemetry, MLHazardEvaluation } from '../types';
import { audioEngine } from '../utils/audioAlert';

interface AiCommanderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTelemetry?: SensorTelemetry;
  mlEvaluation?: MLHazardEvaluation;
  initialQuestion?: string;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'commander';
  text: string;
  source?: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  { label: 'Is Biswa Bangla Sarani open?', icon: Compass },
  { label: 'Which roads are blocked by flood water?', icon: AlertTriangle },
  { label: 'Where is the nearest safe shelter?', icon: Building2 },
  { label: 'Current Kestopur canal & flood stage?', icon: CloudRain },
  { label: 'Lightning & severe storm safety precautions?', icon: Zap },
  { label: 'Generate full tactical situation briefing', icon: Sparkles },
];

export const AiCommanderModal: React.FC<AiCommanderModalProps> = ({
  isOpen,
  onClose,
  currentTelemetry,
  mlEvaluation,
  initialQuestion,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome-msg',
      sender: 'commander',
      text: `### ResQAI Tactical Incident Commander Online 🟢\n\nI am connected to real-time Doppler radar, canal water level telemetry, and road obstruction sensor feeds across Kolkata and North 24 Parganas.\n\nAsk me any question regarding **road navigation**, **safe evacuation corridors**, **high-ground shelters**, or **active disaster hazards** (flood, lightning, dam overflow).`,
      source: 'ResQAI Tactical Network',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (questionToSend?: string) => {
    const activeQuery = questionToSend !== undefined ? questionToSend : query;
    if (!activeQuery.trim() || isLoading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: activeQuery.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (questionToSend === undefined) {
      setQuery('');
    }
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/incident-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customQuestion: activeQuery.trim() }),
      });

      const data = await res.json();
      const answerText = data.answer || data.rawAnalysis || 'Tactical update received.';

      const commanderMsg: MessageItem = {
        id: `commander-${Date.now()}`,
        sender: 'commander',
        text: answerText,
        source: data.source || 'ResQAI Intelligence',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, commanderMsg]);
      audioEngine.playAlertChime();
    } catch (err) {
      console.error('Failed to get AI commander response:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'commander',
          text: '⚠️ Communication timeout with telemetry cluster. Emergency routing advice: Avoid submerged canal underpasses on VIP Road; proceed via elevated Biswa Bangla Sarani towards Salt Lake Central Park or New Town shelters.',
          source: 'Emergency Fail-Safe',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      audioEngine.stopAllAudio();
      setSpeakingId(null);
      return;
    }

    // Clean markdown for text to speech
    const cleanText = text
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/🟢|🔴|⚠️|⚡/g, '');

    audioEngine.speakNavigationGuidance(cleanText.slice(0, 350));
    setSpeakingId(id);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
      <div className="bg-[#0C0C0E] border border-purple-800/60 rounded-2xl max-w-2xl w-full h-[85vh] max-h-[750px] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-purple-900/40 bg-purple-950/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-md">
              <Bot className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white tracking-wide">
                  AI Incident Commander Briefing
                </span>
                <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full border border-purple-700/50 font-mono flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE GROUNDED</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Kolkata & North 24 Parganas District • Disaster Management Operations
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.stopAllAudio();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Threat Bar */}
        {mlEvaluation && (
          <div className="px-5 py-2 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Hazard:</span>
              <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-800/60 text-red-300 font-bold text-[11px]">
                {mlEvaluation.predictedDisaster.replace(/_/g, ' ')} ({mlEvaluation.riskLevel})
              </span>
            </div>
            {currentTelemetry && (
              <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                <span>Rain: <strong className="text-slate-200">{currentTelemetry.rainfall}mm/h</strong></span>
                <span>Canal: <strong className="text-slate-200">{currentTelemetry.riverLevel}m</strong></span>
                <span>Wind: <strong className="text-slate-200">{currentTelemetry.windSpeed}km/h</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Quick Question Chips */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/60 overflow-x-auto scrollbar-none flex items-center space-x-2 shrink-0">
          <span className="text-[10px] font-mono text-purple-400 uppercase shrink-0">Ask Commander:</span>
          {QUICK_PROMPTS.map((prompt, idx) => {
            const Icon = prompt.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(prompt.label)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-purple-950/30 hover:bg-purple-900/50 border border-purple-800/50 hover:border-purple-600 text-purple-200 text-[11px] flex items-center space-x-1.5 shrink-0 transition-all font-sans whitespace-nowrap active:scale-95 disabled:opacity-50"
              >
                <Icon className="w-3 h-3 text-purple-400" />
                <span>{prompt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Chat / Q&A Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center space-x-1.5 mb-1 text-[10px] font-mono text-slate-500">
                <span>{msg.sender === 'user' ? 'You' : 'Incident Commander'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
                {msg.source && (
                  <>
                    <span>•</span>
                    <span className="text-purple-400 font-semibold">{msg.source}</span>
                  </>
                )}
              </div>

              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none shadow-lg shadow-purple-950/40'
                    : 'bg-[#121216] border border-purple-900/40 text-slate-200 rounded-bl-none shadow-md'
                }`}
              >
                {/* Format markdown-like text */}
                <div className="whitespace-pre-wrap space-y-2">
                  {msg.text.split('\n\n').map((para, pIdx) => {
                    // Heading 3
                    if (para.startsWith('### ')) {
                      return (
                        <h4 key={pIdx} className="font-bold text-sm text-purple-300 mt-2 mb-1">
                          {para.replace('### ', '')}
                        </h4>
                      );
                    }
                    // Bullet list items
                    if (para.includes('* ') || para.includes('- ')) {
                      return (
                        <div key={pIdx} className="space-y-1 my-1">
                          {para.split('\n').map((line, lIdx) => {
                            const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
                            const cleanLine = line.replace(/^\s*[\*\-]\s+/, '');
                            return isBullet ? (
                              <div key={lIdx} className="flex items-start space-x-2 text-slate-300">
                                <span className="text-purple-400 mt-1">•</span>
                                <span dangerouslySetInnerHTML={{
                                  __html: cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                                }} />
                              </div>
                            ) : (
                              <p key={lIdx} dangerouslySetInnerHTML={{
                                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                              }} />
                            );
                          })}
                        </div>
                      );
                    }
                    return (
                      <p
                        key={pIdx}
                        dangerouslySetInnerHTML={{
                          __html: para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                        }}
                      />
                    );
                  })}
                </div>

                {/* Actions bar for Commander messages */}
                {msg.sender === 'commander' && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          speakingId === msg.id
                            ? 'bg-purple-900/80 text-purple-200 border border-purple-600'
                            : 'hover:bg-slate-800 hover:text-slate-200'
                        }`}
                        title="Speak briefing aloud"
                      >
                        {speakingId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-purple-300" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-purple-400" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono hover:bg-slate-800 hover:text-slate-200 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      ResQAI Command
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center space-x-2 p-3 bg-purple-950/20 border border-purple-900/40 rounded-xl text-purple-300 text-xs animate-pulse w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Synthesizing live road network & telemetry answer...</span>
            </div>
          )}
        </div>

        {/* Input Controls Bar */}
        <div className="p-3 sm:p-4 border-t border-purple-900/40 bg-[#0A0A0C]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about road navigation, safe shelters, flood levels, or hazards..."
                disabled={isLoading}
                className="w-full bg-[#141418] text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-xs border border-purple-900/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 pr-10 font-sans shadow-inner disabled:opacity-60"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold font-mono tracking-wider flex items-center space-x-2 shadow-lg shadow-purple-950/50 transition-all transform active:scale-95 shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">PROCESSING</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">TRANSMIT</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
