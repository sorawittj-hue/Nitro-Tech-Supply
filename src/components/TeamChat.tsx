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
  mimoApiKey?: string;
  mimoBaseUrl?: string;
  mimoModel?: string;
}

const generateAgentMessages = (): ChatMessage[] => {
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

export const TeamChat: React.FC<TeamChatProps> = ({ agents, mimoApiKey, mimoBaseUrl, mimoModel }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => generateAgentMessages());
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
    }, 15000); // Slowed down background chatter

    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const userText = inputText.trim();
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'CEO เจ',
      avatar: '👑',
      text: userText,
      time,
      isUser: true,
    }]);
    setInputText('');
    setIsTyping(true);

    if (mimoApiKey && mimoBaseUrl) {
      try {
        const prompt = `คุณคือระบบ AI Team ที่ทำงานในบริษัท "Nitro Tech Supply" (ขายส่งและขายปลีกอุปกรณ์ IT)
เจ้านายของคุณ (CEO เจ) เพิ่งส่งข้อความมาว่า: "${userText}"

รายชื่อทีมงานในบริษัท (เลือก 1 คนที่เหมาะสมที่สุดมาตอบ):
${agents.filter(a => a.id !== 'ceo_jay').map(a => `- ${a.name} (${a.title}): ${a.description}`).join('\n')}

กฎการตอบ:
1. เลือกคนตอบที่เข้ากับคำสั่งที่สุด
2. ตอบใน Format นี้เท่านั้น -> ชื่อคนตอบ: ข้อความตอบกลับ
3. ตัวอย่าง -> Max (B2B Sales): รับทราบครับบอส เดี๋ยวผมจัดการเช็คดีลให้เลย
4. ตอบให้สั้น กระชับ เป็นมืออาชีพแต่มีความเป็นมนุษย์/มีชีวิตชีวา (ใช้อีโมจิได้นิดหน่อย)`;

        const response = await fetch(`${mimoBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mimoApiKey}`
          },
          body: JSON.stringify({
            model: mimoModel || "mimo-v2.5-pro",
            messages: [
              { role: "system", content: "You are a helpful AI assistant simulating a team of workers." },
              { role: "user", content: prompt }
            ],
            temperature: 0.7
          })
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const resText = data.choices[0].message.content || '';
        const parts = resText.split(':');
        
        let senderName = "System";
        let avatar = "🤖";
        let replyText = resText;

        if (parts.length >= 2) {
           senderName = parts[0].trim();
           replyText = parts.slice(1).join(':').trim();
           const matchedAgent = agents.find(a => senderName.includes(a.name) || a.name.includes(senderName));
           if (matchedAgent) {
             senderName = matchedAgent.name;
             avatar = matchedAgent.avatar;
           } else {
             const defaultAgent = agents.find(a => a.id !== 'ceo_jay') || agents[0];
             senderName = defaultAgent.name;
             avatar = defaultAgent.avatar;
           }
        } else {
           const defaultAgent = agents.find(a => a.id !== 'ceo_jay') || agents[0];
           senderName = defaultAgent.name;
           avatar = defaultAgent.avatar;
        }

        setMessages(prev => [...prev, {
          id: Date.now().toString() + 'ai',
          sender: senderName,
          avatar: avatar,
          text: replyText,
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        }]);

      } catch (err: any) {
        console.error("MiMo API Error:", err);
        setMessages(prev => [...prev, {
          id: Date.now().toString() + 'err',
          sender: 'System',
          avatar: '⚠️',
          text: `เกิดข้อผิดพลาดในการเชื่อมต่อ MiMo API (${err.message})`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        }]);
      } finally {
        setIsTyping(false);
      }
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + 'mock',
          sender: 'Atlas',
          avatar: '🤖',
          text: `(Mock) รับทราบครับ! (โปรดใส่ Xiaomi MiMo API Key ในหน้า Settings เพื่อคุยกับ AI จริง)`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
      }, 1000);
    }
  };

  return (
    <div className="chat-container" style={{ height: '100%', minHeight: '400px' }}>
      <div className="panel-card-header" style={{ marginBottom: '12px' }}>
        <span className="panel-card-title">💬 TEAM CHAT {mimoApiKey ? '(MIMO AI)' : ''}</span>
        <span className="badge badge-success">LIVE</span>
      </div>

      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto' }}>
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
        {isTyping && (
          <div className="chat-bubble">
             <div className="chat-avatar">...</div>
             <div className="chat-body">
                <div className="chat-text">AI กำลังคิด...</div>
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
