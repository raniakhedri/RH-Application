import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  HiOutlineChatAlt2,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { clientAssistantService, ClientAssistantAction } from '../../api/clientAssistantService';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  actions?: ClientAssistantAction[];
  missingInfo?: string[];
};

const HISTORY_PREFIX = 'client-chat-history';
const THREAD_PREFIX = 'client-chat-thread';

const formatTime = (value: string) => {
  try {
    return new Date(value).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const buildGreeting = (clientName?: string | null): ChatMessage => ({
  id: `msg-${Date.now()}`,
  role: 'assistant',
  content: `Bonjour${clientName ? ` ${clientName}` : ''}. Je peux suivre vos projets, media plans et reunions. Dites-moi ce que vous voulez verifier.`,
  createdAt: new Date().toISOString(),
});

const parseActions = (actions?: ClientAssistantAction[]) =>
  (actions ?? []).map((action) => ({
    ...action,
    status: action.status ?? 'done',
  }));

const toActionLabel = (action: ClientAssistantAction) =>
  action.label || action.type.replace(/_/g, ' ').toLowerCase();

const buildHistoryKey = (clientId: number) => `${HISTORY_PREFIX}-${clientId}`;
const buildThreadKey = (clientId: number) => `${THREAD_PREFIX}-${clientId}`;

const loadHistory = (clientId: number): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(buildHistoryKey(clientId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistHistory = (clientId: number, messages: ChatMessage[]) => {
  try {
    const trimmed = messages.slice(-80);
    localStorage.setItem(buildHistoryKey(clientId), JSON.stringify(trimmed));
  } catch {
    // ignore
  }
};

const loadThreadId = (clientId: number) => {
  try {
    return localStorage.getItem(buildThreadKey(clientId));
  } catch {
    return null;
  }
};

const persistThreadId = (clientId: number, threadId: string) => {
  try {
    localStorage.setItem(buildThreadKey(clientId), threadId);
  } catch {
    // ignore
  }
};

const quickPrompts = [
  'Ou en est le projet en cours ?',
  'Quelles publications sont prevues cette semaine ?',
  'Y a-t-il des rectifs en attente ?',
  'Quelle est la prochaine reunion ?',
];

const ClientChatWidget: React.FC<{ clientId?: number; clientName?: string | null }> = ({
  clientId,
  clientName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientId) return;
    const stored = loadHistory(clientId);
    if (stored.length > 0) {
      setMessages(stored);
    } else {
      setMessages([buildGreeting(clientName)]);
    }
    setThreadId(loadThreadId(clientId));
  }, [clientId, clientName]);

  useEffect(() => {
    if (!clientId || messages.length === 0) return;
    persistHistory(clientId, messages);
  }, [clientId, messages]);

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, isOpen, isLoading]);

  const hasSuggestions = useMemo(() => messages.length <= 1, [messages.length]);

  const pushMessage = (next: ChatMessage) => {
    setMessages((prev) => [...prev, next]);
  };

  const handleSend = async (text?: string) => {
    if (!clientId) return;
    const payload = (text ?? input).trim();
    if (!payload || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: payload,
      createdAt: new Date().toISOString(),
    };

    pushMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const res = await clientAssistantService.ask({
        clientId,
        message: payload,
        threadId,
      });

      const data = (res as any)?.data?.data ?? (res as any)?.data ?? {};
      const reply = typeof data.reply === 'string' && data.reply.trim()
        ? data.reply
        : 'Je suis la, mais je ne trouve pas encore assez de contexte pour repondre.';

      const actions = parseActions(data.executedActions ?? data.actions ?? []);
      const missingInfo = data.missing_info ?? data.missingInfo ?? [];

      if (data.threadId && clientId) {
        setThreadId(data.threadId);
        persistThreadId(clientId, data.threadId);
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: reply,
        createdAt: new Date().toISOString(),
        actions,
        missingInfo: Array.isArray(missingInfo) ? missingInfo : [],
      };

      pushMessage(assistantMessage);
    } catch {
      pushMessage({
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Le service IA est indisponible pour le moment. Reessayez dans quelques instants.',
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!clientId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[12000] flex flex-col items-end gap-3 font-outfit">
      {isOpen && (
        <div className="w-[360px] max-w-[calc(100vw-2rem)]">
          <div className="relative overflow-hidden rounded-[24px] border border-amber-100/60 bg-white/90 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-emerald-950/40 dark:bg-gray-900/90">
            <div className="relative overflow-hidden rounded-t-[24px] border-b border-amber-100/60 bg-gradient-to-r from-amber-50 via-orange-50 to-emerald-50 px-4 py-3 dark:border-emerald-950/40 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950">
              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-amber-300/30 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-emerald-300/20 blur-3xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Assistant Client 360</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Suivi projet, media plan, reunions</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-amber-100/60 bg-white/80 p-2 text-gray-500 shadow-sm transition hover:scale-105 hover:text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  aria-label="Fermer"
                >
                  <HiOutlineX size={16} />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="max-h-[360px] space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-400 text-white'
                          : 'border border-gray-100 bg-white text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                    </div>

                    {msg.actions && msg.actions.length > 0 && (
                      <div className="rounded-xl border border-amber-100/60 bg-amber-50/60 px-3 py-2 text-[11px] text-gray-700 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                          Actions executees
                        </p>
                        <div className="space-y-1">
                          {msg.actions.map((action, index) => {
                            const icon = action.status === 'failed' ? HiOutlineExclamationCircle : HiOutlineCheckCircle;
                            const Icon = icon;
                            const tone = action.status === 'failed' ? 'text-red-500' : 'text-emerald-500';
                            return (
                              <div key={`${action.type}-${index}`} className="flex items-center gap-2">
                                <Icon size={14} className={tone} />
                                <span>{toActionLabel(action)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {msg.missingInfo && msg.missingInfo.length > 0 && (
                      <div className="rounded-xl border border-amber-100/60 bg-white px-3 py-2 text-[11px] text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Infos manquantes</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {msg.missingInfo.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <span className="text-[10px] text-gray-400">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-orange-400 animate-bounce [animation-delay:120ms]" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:240ms]" />
                  <span className="ml-1">Analyse en cours...</span>
                </div>
              )}

              {hasSuggestions && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="rounded-full border border-amber-200/70 bg-white px-3 py-1 text-[11px] text-gray-600 transition hover:border-amber-400 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-amber-100/60 px-4 py-3 dark:border-gray-800">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="Tapez votre demande..."
                  className="min-h-[44px] flex-1 resize-none rounded-2xl border border-amber-100/70 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-400 text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Envoyer"
                >
                  <HiOutlinePaperAirplane size={18} />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
                <HiOutlineSparkles size={12} />
                <span>Execution directe active (sans validation).</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-400 text-white shadow-2xl shadow-orange-500/30 transition hover:scale-105"
        aria-label="Ouvrir l'assistant client"
      >
        {isOpen ? <HiOutlineX size={20} /> : <HiOutlineChatAlt2 size={20} />}
        <span className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-white dark:ring-gray-900" />
      </button>
    </div>
  );
};

export default ClientChatWidget;
