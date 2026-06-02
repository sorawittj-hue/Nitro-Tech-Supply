import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Agent } from '../data/agents';
import { useApp } from '../context/AppContext';
import { createChatProvider } from '../providers/providerFactory';
import { TelegramSyncService } from '../providers/telegramSyncService';
import type { ChatMessage } from '../providers/types';
import { transport } from '../transport';

interface TeamChatProps {
  agents: Agent[];
}

interface QuickCommand {
  label: string;
  prompt: string;
}

const QUICK_COMMANDS: QuickCommand[] = [
  {
    label: 'สรุปวันนี้',
    prompt: 'ช่วยสรุปสถานะบริษัทวันนี้แบบ CEO briefing: เงินสด สต็อก ออเดอร์ งานเสี่ยง และสิ่งที่ผมควรตัดสินใจ 3 ข้อ',
  },
  {
    label: 'สต็อกเสี่ยง',
    prompt: 'Atlas และ Mira ช่วยเช็ค SKU ที่เสี่ยงขาดสต็อก พร้อมเสนอแผนเติมของและงบที่ควรใช้',
  },
  {
    label: 'เงินสด',
    prompt: 'Vega ช่วยสรุป cashflow ลูกหนี้ค้างรับ ค่าใช้จ่ายที่ต้องระวัง และเงินที่ควรสำรองสัปดาห์นี้',
  },
  {
    label: 'ดีลขายส่ง',
    prompt: 'Max และ Nova ช่วยวางแผนดีลขายส่งอุปกรณ์คอมพิวเตอร์ไอทีสำหรับลูกค้า B2B พร้อมราคาและข้อเสนอ',
  },
];

export const TeamChat: React.FC<TeamChatProps> = ({ agents }) => {
  const {
    aiApiKey,
    aiModel,
    chatProvider,
    hermesConfig,
    hermesConnected,
    setAgents,
  } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const providerConfig = useMemo(() => ({
    ...hermesConfig,
    mimoApiKey: aiApiKey,
    mimoModel: aiModel,
  }), [aiApiKey, aiModel, hermesConfig]);

  const activeProvider = useMemo(() => (
    createChatProvider(chatProvider, providerConfig)
  ), [chatProvider, providerConfig]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (chatProvider !== 'hermes') return;
    const telegramSync = new TelegramSyncService(providerConfig);
    telegramSync.start(message => {
      setMessages(prev => [...prev, message]);
    });
    return () => telegramSync.stop();
  }, [chatProvider, providerConfig]);

  const systemPrompt = useMemo(() => buildSystemPrompt(agents), [agents]);

  const handleQuickCommand = (prompt: string) => {
    if (isTyping) return;
    setInputText(prompt);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const userText = inputText.trim();
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'CEO เจ',
      avatar: '👑',
      text: userText,
      time,
      isUser: true,
      source: 'dashboard',
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputText('');
    setIsTyping(true);

    transport.send({
      type: 'chat.send',
      text: userText,
      sessionKey: providerConfig.hermesSessionKey,
      source: 'dashboard',
      timestamp: Date.now(),
    });

    try {
      const reply = await activeProvider.sendMessage(nextMessages, systemPrompt);
      const parsedReply = parseAgentReply(reply, agents);
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: parsedReply.sender,
        avatar: parsedReply.avatar,
        text: parsedReply.text,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        source: 'dashboard',
      }]);

      setAgents(prev => prev.map(agent => agent.name === parsedReply.sender
        ? {
            ...agent,
            isLive: chatProvider === 'hermes' ? hermesConnected : true,
            providerId: chatProvider,
            lastActiveAt: Date.now(),
          }
        : agent
      ));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'System',
        avatar: '⚠️',
        text: `เชื่อมต่อ ${activeProvider.label} ไม่สำเร็จ (${errMsg})`,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        source: 'system',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-container" style={{ height: '100%', minHeight: '400px' }}>
      <div className="panel-card-header" style={{ marginBottom: '12px' }}>
        <span className="panel-card-title">💬 TEAM CHAT {renderProviderStatus(chatProvider, hermesConnected)}</span>
        <span className={`badge ${activeProvider.isConnected() ? 'badge-success' : 'badge-warning'}`}>
          {activeProvider.isConnected() ? 'LIVE' : 'CONFIG'}
        </span>
      </div>

      <div className="chat-quick-actions" aria-label="CEO quick commands">
        {QUICK_COMMANDS.map(command => (
          <button
            key={command.label}
            type="button"
            className="chat-quick-action"
            onClick={() => handleQuickCommand(command.prompt)}
            disabled={isTyping}
            title={command.prompt}
          >
            {command.label}
          </button>
        ))}
      </div>

      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto' }}>
        {messages.map(msg => (
          <div key={msg.id} className="chat-bubble">
            <div className="chat-avatar">{msg.avatar}</div>
            <div className="chat-body" style={msg.isUser ? { borderColor: 'rgba(251, 191, 36, 0.2)', background: 'rgba(251, 191, 36, 0.05)' } : {}}>
              <div className="chat-meta">
                <span className="chat-name" style={msg.isUser ? { color: 'var(--accent-amber)' } : {}}>{msg.sender}</span>
                {msg.source === 'telegram' && <span className="badge badge-info" style={{ fontSize: '10px', padding: '1px 5px' }}>📱</span>}
                <span className="chat-time">{msg.time}</span>
              </div>
              <div className="chat-text">{msg.text}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-bubble">
            <div className="chat-avatar">...</div>
            <div className="chat-body">
              <div className="chat-text">{activeProvider.label} กำลังคิด...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="chat-input-field"
          placeholder="พิมพ์คำสั่งถึงทีม..."
          disabled={isTyping}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px' }} disabled={isTyping}>ส่ง</button>
      </form>
    </div>
  );
};

function buildSystemPrompt(agents: Agent[]): string {
  const roster = agents
    .filter(agent => !isCeoAgent(agent))
    .map(agent => `${agent.name} (${agent.title}): ${agent.description}`)
    .join('\n');

  return `You are an AI agent team at "Nitro Tech Supply" - a B2B IT hardware wholesale and retail company in Thailand.
The CEO (Jay) is talking to you from the Nitro Tech Supply dashboard UI or via Telegram.
Reply as the most appropriate team member based on the request.
Format: [AgentName] ([Title]): [response]
Keep responses concise, professional, with slight personality. Use Thai or English based on the CEO's message.
The full agent roster is:
${roster}`;
}

function parseAgentReply(reply: string, agents: Agent[]): { sender: string; avatar: string; text: string } {
  const [senderPart, ...rest] = reply.split(':');
  const defaultAgent = agents.find(agent => !isCeoAgent(agent)) || agents[0];
  if (rest.length === 0) {
    return { sender: defaultAgent.name, avatar: defaultAgent.avatar, text: reply };
  }

  const senderHint = senderPart.trim();
  const matchedAgent = agents.find(agent => !isCeoAgent(agent) && (
    senderHint.includes(agent.name.split('(')[0].trim()) || agent.name.includes(senderHint)
  ));
  return {
    sender: matchedAgent?.name || defaultAgent.name,
    avatar: matchedAgent?.avatar || defaultAgent.avatar,
    text: rest.join(':').trim(),
  };
}

function renderProviderStatus(provider: string, hermesConnected: boolean): string {
  if (provider === 'hermes') return hermesConnected ? '(HERMES LIVE 🟢)' : '(HERMES OFFLINE 🔴)';
  if (provider === 'mimo') return '(MIMO AI)';
  return '(NO PROVIDER)';
}

function isCeoAgent(agent: Agent): boolean {
  return agent.id === 'ceo-jay-command' || agent.sessionId === 'ceo-jay-command' || agent.authorityLevel === 'Owner';
}
