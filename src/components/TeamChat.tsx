import React, { useState, useRef, useEffect } from 'react';
import type { Agent } from '../data/agents';

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isUser?: boolean;
}

interface TeamChatProps {
  agents: Agent[];
}

const generateAgentMessages = (agents: Agent[]): ChatMessage[] => {
  const messages: ChatMessage[] = [
    {
      id: '1',
      sender: 'CEO เจ',
      avatar: '👑',
      text: 'ทีมครับ วันนี้มียอดสั่งซื้อ GPU เข้ามาเยอะ ช่วยเช็คสต็อกด่วน',
      time: '09:15',
      isUser: true,
    },
    {
      id: '2',
      sender: 'Atlas',
      avatar: '🤖',
      text: 'รับทราบครับ CEO เช็คแล้ว RTX 4070 เหลือ 42 ตัว, RTX 4060 เหลือ 18 ตัว กำลังสั่งเติมคลัง',
      time: '09:16',
    },
    {
      id: '3',
      sender: 'Max',
      avatar: '🧙‍♂️',
      text: 'มีลูกค้าจาก Pantip ขอล็อต GPU 50 ตัว มาร์จิน 12% ปิดไหมครับ?',
      time: '09:18',
    },
    {
      id: '4',
      sender: 'CEO เจ',
      avatar: '👑',
      text: 'เพิ่มมาร์จินเป็น 15% ถ้าตกลงก็ปิดเลย',
      time: '09:19',
      isUser: true,
    },
    {
      id: '5',
      sender: 'Luna',
      avatar: '🧑‍💻',
      text: 'มีเคลม RTX 4060 อีก 2 ตัว ลูกค้าแจ้งว่า artifact ตอนเล่นเกม จะ benchmark เทียบกับของใหม่',
      time: '09:22',
    },
    {
      id: '6',
      sender: 'Nova',
      avatar: '👨‍🎨',
      text: 'อัปเดตราคาขายปลีกหน้าเว็บแล้วครับ ปรับตามตลาดคู่แข่ง ราคา RTX 4070 ลดลง ฿500',
      time: '09:25',
    },
  ];
  return messages;
};

export const TeamChat: React.FC<TeamChatProps> = ({ agents }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => generateAgentMessages(agents));
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-generate agent chatter
  useEffect(() => {
    const chats = [
      { sender: 'Atlas', avatar: '🤖', text: 'สต็อก DDR5 RAM เหลือน้อย กำลังสั่งเพิ่ม 100 ตัว' },
      { sender: 'Max', avatar: '🧙‍♂️', text: 'ปิดดีลส่งออก SSD 200 ตัวไป สิงคโปร์ มาร์จิน 18%' },
      { sender: 'Orion', avatar: '🕵️‍♂️', text: 'ตรวจเอกสารศุลกากรล็อตนำเข้าจากไต้หวันเสร็จแล้ว' },
      { sender: 'Luna', avatar: '🧑‍💻', text: 'เทสต์เมนบอร์ด B650 ล็อตใหม่ ผ่าน QA 100%' },
      { sender: 'Nova', avatar: '👨‍🎨', text: 'แบนเนอร์ Flash Sale สัปดาห์นี้พร้อมแล้ว รอ CEO อนุมัติ' },
      { sender: 'Atlas', avatar: '🤖', text: 'RFID scan ประจำวันเสร็จ ไม่มีของหาย' },
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const chat = chats[Math.floor(Math.random() * chats.length)];
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev.slice(-20), {
          id: Date.now().toString(),
          sender: chat.sender,
          avatar: chat.avatar,
          text: chat.text,
          time,
        }]);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'CEO เจ',
      avatar: '👑',
      text: inputText.trim(),
      time,
      isUser: true,
    }]);
    setInputText('');
  };

  return (
    <div className="chat-container" style={{ height: '100%', minHeight: '400px' }}>
      <div className="panel-card-header" style={{ marginBottom: '12px' }}>
        <span className="panel-card-title">💬 TEAM CHAT</span>
        <span className="badge badge-success">LIVE</span>
      </div>

      <div className="chat-messages" style={{ flex: 1 }}>
        {messages.map(msg => (
          <div key={msg.id} className="chat-bubble">
            <div className="chat-avatar">{msg.avatar}</div>
            <div className="chat-body" style={msg.isUser ? { borderColor: 'rgba(251, 191, 36, 0.2)', background: 'rgba(251, 191, 36, 0.05)' } : {}}>
              <div className="chat-meta">
                <span className="chat-name" style={msg.isUser ? { color: 'var(--accent-amber)' } : {}}>{msg.sender}</span>
                <span className="chat-time">{msg.time}</span>
              </div>
              <div className="chat-text">{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="chat-input-field"
          placeholder="พิมพ์คำสั่งถึงทีม..."
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px' }}>ส่ง</button>
      </form>
    </div>
  );
};
