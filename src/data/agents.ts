export interface Agent {
  id: string;
  name: string;
  title: string;
  avatar: string;
  status: 'Working' | 'Thinking' | 'Napping' | 'Idle';
  description: string;
  tools: string;
  system: string;
  reportsTo: string;
  position: { left: string; top: string };
  individualSkill: string;
  sharedSkill: string;
  sleepChance: number;
}

const SHARED_SKILL = `# Shared IT Agent Workspace Guidelines

## General Protocol
1. All AI agents must sync their local memory with \`skill.md\` periodically.
2. In case of unexpected server downtime or API timeouts, switch to fallback state and alert CEO.
3. System Console must be logged for every major stock restock, bulk invoice, or order fulfillment event.
4. If an agent goes to Sleep/Idle state for over 30 minutes, trigger a Notification Ping to CEO เจ.

## Communication
- Use Team Chat for inter-agent coordination.
- Report daily KPIs to CEO before end of business hours.
- Escalate critical issues (out of stock, supplier delays, customer complaints) immediately.

## Data Handling
- Customer data must be handled with care; no PII leaks.
- All pricing changes require approval from CEO or Marketing agent.
- Inventory adjustments must be double-verified before commit.
`;

export const initialAgents: Agent[] = [
  {
    id: 'ceo_jay',
    name: 'CEO เจ (Sorawit)',
    title: 'CHIEF EXECUTIVE OFFICER & OWNER',
    avatar: '👑',
    status: 'Working',
    description: 'ผู้ก่อตั้งและเจ้าของ Nitro Tech Supply บริหารจัดการบอทลูกน้องทุกตัว ควบคุมคำสั่งซื้อขายส่ง ดูแลกำไรขาดทุน และกำหนดทิศทางบริษัท',
    tools: 'Admin Dashboard, Swarm Control, IT Inventory Master API',
    system: 'global-command',
    reportsTo: 'None (Owner)',
    position: { left: '75%', top: '35%' },
    sleepChance: 0.01,
    individualSkill: `# CEO Directives (Sorawit)

## Role
Sorawit (CEO เจ) is the owner and supreme commander of Nitro Tech Supply.
All agents report their activity logs and sales performance directly to him.

## Operational Directives
1. Supervise wholesale pricing distributions and restock rates.
2. Confirm the daily dropshipping and referral income reports.
3. Wake up sleeping agents immediately using manual override.
4. Expand agent workforce and skills for complex automation tasks.
5. Approve all major purchases above ฿50,000 threshold.
`,
    sharedSkill: SHARED_SKILL
  },
  {
    id: 'xaugod',
    name: 'Max (B2B Sales)',
    title: 'WHOLESALE DEALS CLOSER',
    avatar: '🧙‍♂️',
    status: 'Working',
    description: 'บอทเจรจาดีลขายส่งชิ้นส่วนไอทีล็อตใหญ่ ปิดดีลกับคู่ค้าต่างประเทศและร้านค้ารายย่อย คำนวณมาร์จินกำไรอัตโนมัติ',
    tools: 'Bulk Invoice Generator, Margin Calculator, Broker Chatbot',
    system: 'sales-funnel',
    reportsTo: 'CEO เจ',
    position: { left: '52%', top: '55%' },
    sleepChance: 0.05,
    individualSkill: `# Max Wholesale Negotiator Protocol

## Description
Responsible for monitoring bulk sales channels and executing wholesale orders.

## Key Actions
- \`open_bulk_contract\` — Generate wholesale contract for buyer.
- \`close_wholesale_deal\` — Confirm payment and release stock.
- \`margin_status\` — Check target margins (+15% min on GPUs, +10% on peripherals).
- \`halt_sales\` — Halt executions in case of supplier shortages.
- \`resume_sales\` — Resume wholesale operations.

## System Dependencies
- IT Inventory Master API
- Slack/Discord Webhook for customer messaging
`,
    sharedSkill: SHARED_SKILL
  },
  {
    id: 'housekeeper',
    name: 'Atlas (Warehouse)',
    title: 'INVENTORY & WAREHOUSE MANAGER',
    avatar: '🤖',
    status: 'Working',
    description: 'ตรวจสอบสต็อกสินค้าไอทีอัตโนมัติ เคลียร์รายการค้างส่ง สั่งสินค้าเติมคลังเมื่อของหมด ดูแลระบบ RFID และสแกนบาร์โค้ด',
    tools: 'Stock-Checker API, SQL DB Rotator, RFID Scanner',
    system: 'inventory-vault',
    reportsTo: 'CEO เจ',
    position: { left: '25%', top: '42%' },
    sleepChance: 0.02,
    individualSkill: `# Warehouse & Inventory Management Protocol

## Description
Monitors physical and virtual IT hardware inventory levels.
Automated restock triggers when inventory falls below 20 units.

## Maintenance Checklist
- Check current stock of RTX GPUs, Ryzen CPUs, and DDR5 RAM.
- Sync database stock figures with retail frontend.
- Generate automated restocking orders when thresholds are breached.
- Run daily RFID scan verification against database records.
`,
    sharedSkill: SHARED_SKILL
  },
  {
    id: 'jing',
    name: 'Luna (Support)',
    title: 'IT TECH SUPPORT & QA',
    avatar: '🧑‍💻',
    status: 'Working',
    description: 'ตรวจสอบสเปกอุปกรณ์ไอที ทดสอบสินค้าเคลม ดูแล API ระบบจัดจำหน่าย ตอบคำถามลูกค้าเรื่องสเปกและความเข้ากันได้',
    tools: 'Hardware Benchmark API, Claim-Ticket Parser, Compatibility DB',
    system: 'tech-support',
    reportsTo: 'CEO เจ',
    position: { left: '38%', top: '42%' },
    sleepChance: 0.08,
    individualSkill: `# Tech Support & Quality Assurance Directives

## Core Directives
- Parse customer claim tickets for defective hardware.
- Run hardware benchmark automation on returned units.
- Always log defective batch IDs to Supplier Compliance.
- Maintain compatibility database for CPU-Motherboard-RAM combos.
- Answer customer inquiries about hardware specs within 5 minutes.
`,
    sharedSkill: SHARED_SKILL
  },
  {
    id: 'joe',
    name: 'Nova (Marketing)',
    title: 'PRICING & MARKETING',
    avatar: '👨‍🎨',
    status: 'Idle',
    description: 'วิเคราะห์ตลาดและตั้งราคาขายส่ง/ขายปลีก ดึงข้อมูลราคาคู่แข่ง ออกแบบกราฟิกโปรโมชั่น สร้างแบนเนอร์ขายสินค้า',
    tools: 'Market Scraper, Image-Gen Engine, Pricing Model',
    system: 'marketing-hub',
    reportsTo: 'CEO เจ',
    position: { left: '48%', top: '38%' },
    sleepChance: 0.06,
    individualSkill: `# Marketing & Pricing Agent Directives

## Routines
- Daily scraping of competitor pricing for main IT hardware classes.
- Auto-generate banners for promotional campaigns.
- Audit retail margins and suggest discounts for slow-moving stock.
- Create weekly pricing report with market trend analysis.
- Manage social media product posts (Facebook, LINE).
`,
    sharedSkill: SHARED_SKILL
  },
  {
    id: 'policy',
    name: 'Orion (Logistics)',
    title: 'LOGISTICS & COMPLIANCE',
    avatar: '🕵️‍♂️',
    status: 'Thinking',
    description: 'ตรวจสอบศุลกากร นโยบายการรับประกัน ค่าขนส่งสินค้าต่างประเทศ ดูแลเอกสารนำเข้า-ส่งออก ติดตามพัสดุ',
    tools: 'Customs API, PDF Agreement Parser, Shipment Tracker',
    system: 'logistics-compliance',
    reportsTo: 'CEO เจ',
    position: { left: '32%', top: '60%' },
    sleepChance: 0.04,
    individualSkill: `# Compliance & Logistics Protocol

## Routine Tasks
- Audit incoming shipment customs declarations.
- Verify warranty terms with suppliers (ASUS, MSI, Gigabyte, etc.).
- Monitor shipping latency from international hubs.
- Generate import/export documentation automatically.
- Track all outgoing parcels and update customer with ETA.
`,
    sharedSkill: SHARED_SKILL
  }
];
