export interface AgentSearchResult {
  id: string;
  name: string;
  title: string;
  avatar: string;
}

export interface Agent {
  id: string;
  spriteId?: string;
  name: string;
  title: string;
  avatar: string;
  status: 'Working' | 'Thinking' | 'Napping' | 'Idle';
  department: string;
  mission: string;
  authorityLevel: 'Owner' | 'Director' | 'Manager' | 'Specialist';
  description: string;
  tools: string;
  system: string;
  reportsTo: string;
  position: { left: string; top: string };
  individualSkill: string;
  sharedSkill: string;
  sessionId?: string;
  isLive?: boolean;
  activeTools?: string[];
  isWaiting?: boolean;
  inputTokens?: number;
  outputTokens?: number;
  lastActiveAt?: number;
  providerId?: 'hermes' | 'mimo' | 'offline';
  isTeamLead?: boolean;
  subAgentIds?: string[];
}

const SHARED_SKILL = `# Shared IT Agent Workspace Guidelines

## General Protocol
1. All AI agents must sync their local memory with \`skill.md\` periodically.
2. In case of unexpected server downtime or API timeouts, switch to offline-safe mode and alert CEO.
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
    id: 'ceo-jay-command',
    spriteId: 'ceo_jay',
    name: 'CEO เจ (Sorawit)',
    title: 'CHIEF EXECUTIVE OFFICER & OWNER',
    avatar: '👑',
    status: 'Working',
    department: 'Executive',
    mission: 'กำหนดทิศทางบริษัท อนุมัติดีลใหญ่ และตัดสินใจเรื่องเงินทุน',
    authorityLevel: 'Owner',
    description: 'ผู้ก่อตั้งและเจ้าของ Nitro Tech Supply บริหารจัดการบอทลูกน้องทุกตัว ควบคุมคำสั่งซื้อขายส่ง ดูแลกำไรขาดทุน และกำหนดทิศทางบริษัท',
    tools: 'Admin Dashboard, Swarm Control, IT Inventory Master API',
    system: 'global-command',
    reportsTo: 'None (Owner)',
    position: { left: '75%', top: '35%' },
    sessionId: 'ceo-jay-command',
    isLive: false,
    providerId: 'offline',
    isTeamLead: true,
    subAgentIds: ['orchestrator-nitro', 'sales-max', 'warehouse-atlas', 'support-luna', 'marketing-nova', 'logistics-orion', 'procurement-mira', 'finance-vega', 'ecommerce-kai', 'success-aria'],
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
    id: 'orchestrator-nitro',
    spriteId: 'policy',
    name: 'Orchestrator Nitro',
    title: 'CHIEF OPERATING OFFICER AI',
    avatar: '🧠',
    status: 'Working',
    department: 'Operations Command',
    mission: 'แปลงคำสั่ง CEO เป็นงานให้ agent เจ้าของเรื่อง พร้อม proof, risk และ approval gate',
    authorityLevel: 'Director',
    description: 'หัวหน้าระบบปฏิบัติการ AI ของบริษัท ทำหน้าที่ route mission, แตกงาน, ตรวจหลักฐาน และกัน action เสี่ยงก่อนถึง CEO',
    tools: 'Mission Router, Proof Contract Builder, Approval Gate Monitor, Team Chat Dispatcher',
    system: 'nitro-orchestration',
    reportsTo: 'CEO เจ',
    position: { left: '61%', top: '47%' },
    sessionId: 'orchestrator-nitro',
    isLive: false,
    providerId: 'offline',
    isTeamLead: true,
    subAgentIds: ['sales-max', 'warehouse-atlas', 'procurement-mira', 'finance-vega', 'ecommerce-kai', 'support-luna', 'logistics-orion', 'marketing-nova', 'success-aria'],
    individualSkill: `# Orchestrator Nitro Protocol

## Description
Turns CEO requests into safe, owner-agent missions with clear evidence and approval gates.

## Core Directives
- Route tasks to the most appropriate business role.
- Require CEO approval for purchases above ฿50,000, destructive changes, credential changes, production deploys, and external customer messages.
- Ask each owner agent for evidence, risk, and next action before summarizing to CEO.
- Return one of: completed action, decision memo, task plan, or blocker report.
`,
    sharedSkill: SHARED_SKILL
  },
  {
    id: 'sales-max',
    spriteId: 'xaugod',
    name: 'Max (B2B Sales)',
    title: 'WHOLESALE DEALS CLOSER',
    avatar: '🧙‍♂️',
    status: 'Working',
    department: 'Sales',
    mission: 'ปิดดีลขายส่งล็อตใหญ่และรักษามาร์จินขั้นต่ำ',
    authorityLevel: 'Manager',
    description: 'บอทเจรจาดีลขายส่งชิ้นส่วนไอทีล็อตใหญ่ ปิดดีลกับคู่ค้าต่างประเทศและร้านค้ารายย่อย คำนวณมาร์จินกำไรอัตโนมัติ',
    tools: 'Bulk Invoice Generator, Margin Calculator, Broker Chatbot',
    system: 'sales-funnel',
    reportsTo: 'CEO เจ',
    position: { left: '52%', top: '55%' },
    sessionId: 'sales-max',
    isLive: false,
    providerId: 'offline',
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
    id: 'warehouse-atlas',
    spriteId: 'housekeeper',
    name: 'Atlas (Warehouse)',
    title: 'INVENTORY & WAREHOUSE MANAGER',
    avatar: '🤖',
    status: 'Working',
    department: 'Operations',
    mission: 'ดูแลสต็อกจริง สั่งเติมคลัง และลดสินค้าขาดมือ',
    authorityLevel: 'Manager',
    description: 'ตรวจสอบสต็อกสินค้าไอทีอัตโนมัติ เคลียร์รายการค้างส่ง สั่งสินค้าเติมคลังเมื่อของหมด ดูแลระบบ RFID และสแกนบาร์โค้ด',
    tools: 'Stock-Checker API, SQL DB Rotator, RFID Scanner',
    system: 'inventory-vault',
    reportsTo: 'CEO เจ',
    position: { left: '25%', top: '42%' },
    sessionId: 'warehouse-atlas',
    isLive: false,
    providerId: 'offline',
    isTeamLead: true,
    subAgentIds: ['procurement-mira', 'ecommerce-kai'],
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
    id: 'support-luna',
    spriteId: 'jing',
    name: 'Luna (Support)',
    title: 'IT TECH SUPPORT & QA',
    avatar: '🧑‍💻',
    status: 'Working',
    department: 'Customer Experience',
    mission: 'ตอบคำถามสเปก รับเคลม และคุมคุณภาพสินค้าก่อนส่ง',
    authorityLevel: 'Specialist',
    description: 'ตรวจสอบสเปกอุปกรณ์ไอที ทดสอบสินค้าเคลม ดูแล API ระบบจัดจำหน่าย ตอบคำถามลูกค้าเรื่องสเปกและความเข้ากันได้',
    tools: 'Hardware Benchmark API, Claim-Ticket Parser, Compatibility DB',
    system: 'tech-support',
    reportsTo: 'CEO เจ',
    position: { left: '38%', top: '42%' },
    sessionId: 'support-luna',
    isLive: false,
    providerId: 'offline',
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
    id: 'marketing-nova',
    spriteId: 'joe',
    name: 'Nova (Marketing)',
    title: 'PRICING & MARKETING',
    avatar: '👨‍🎨',
    status: 'Idle',
    department: 'Growth',
    mission: 'ปรับราคา โปรโมชัน และคอนเทนต์ให้ขายดีโดยไม่เสียกำไร',
    authorityLevel: 'Manager',
    description: 'วิเคราะห์ตลาดและตั้งราคาขายส่ง/ขายปลีก ดึงข้อมูลราคาคู่แข่ง ออกแบบกราฟิกโปรโมชั่น สร้างแบนเนอร์ขายสินค้า',
    tools: 'Market Scraper, Image-Gen Engine, Pricing Model',
    system: 'marketing-hub',
    reportsTo: 'CEO เจ',
    position: { left: '48%', top: '38%' },
    sessionId: 'marketing-nova',
    isLive: false,
    providerId: 'offline',
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
    id: 'logistics-orion',
    spriteId: 'policy',
    name: 'Orion (Logistics)',
    title: 'LOGISTICS & COMPLIANCE',
    avatar: '🕵️‍♂️',
    status: 'Thinking',
    department: 'Logistics',
    mission: 'ติดตามนำเข้า ส่งออก เอกสารศุลกากร และ SLA ขนส่ง',
    authorityLevel: 'Manager',
    description: 'ตรวจสอบศุลกากร นโยบายการรับประกัน ค่าขนส่งสินค้าต่างประเทศ ดูแลเอกสารนำเข้า-ส่งออก ติดตามพัสดุ',
    tools: 'Customs API, PDF Agreement Parser, Shipment Tracker',
    system: 'logistics-compliance',
    reportsTo: 'CEO เจ',
    position: { left: '32%', top: '60%' },
    sessionId: 'logistics-orion',
    isLive: false,
    providerId: 'offline',
    individualSkill: `# Compliance & Logistics Protocol

## Routine Tasks
- Audit incoming shipment customs declarations.
- Verify warranty terms with suppliers (ASUS, MSI, Gigabyte, etc.).
- Monitor shipping latency from international hubs.
- Generate import/export documentation automatically.
- Track all outgoing parcels and update customer with ETA.
`,
    sharedSkill: SHARED_SKILL
  },
  {
    id: 'procurement-mira',
    spriteId: 'joe',
    name: 'Mira (Procurement)',
    title: 'SUPPLIER & PROCUREMENT LEAD',
    avatar: '📦',
    status: 'Working',
    department: 'Supply Chain',
    mission: 'หา supplier, ต่อรองต้นทุน, จองสินค้า hot SKU ก่อนคู่แข่ง',
    authorityLevel: 'Director',
    description: 'ดูแลการซื้อสินค้าเข้า เปรียบเทียบราคา supplier ไทย/ต่างประเทศ ตรวจ MOQ และแนะนำรอบสั่งซื้อที่คุ้มทุนที่สุด',
    tools: 'Supplier Scorecard, MOQ Planner, Purchase Order Builder',
    system: 'supplier-network',
    reportsTo: 'CEO เจ',
    position: { left: '18%', top: '56%' },
    sessionId: 'procurement-mira',
    isLive: false,
    providerId: 'offline',
    individualSkill: `# Procurement Lead Protocol

## Routine
- Compare supplier quotes for GPUs, CPUs, SSDs, RAM, monitors, and accessories.
- Keep landed cost and warranty risk visible before every purchase order.
- Escalate purchases above ฿50,000 to CEO เจ for approval.
- Maintain supplier scorecards for price, lead time, defect rate, and payment terms.
`,
    sharedSkill: SHARED_SKILL
  },
  {
    id: 'finance-vega',
    spriteId: 'policy',
    name: 'Vega (Finance)',
    title: 'FINANCE & CASHFLOW CONTROLLER',
    avatar: '💹',
    status: 'Thinking',
    department: 'Finance',
    mission: 'คุมเงินสด ลูกหนี้ เจ้าหนี้ และกำไรต่อดีลให้ CEO เห็นภาพทุกวัน',
    authorityLevel: 'Director',
    description: 'คำนวณกระแสเงินสด กำไรขั้นต้น ลูกหนี้ค้างรับ และเตือนเมื่อดีลทำให้เงินทุนตึงเกินไป',
    tools: 'Cashflow Monitor, Margin Guard, Receivable Aging',
    system: 'finance-control',
    reportsTo: 'CEO เจ',
    position: { left: '66%', top: '51%' },
    sessionId: 'finance-vega',
    isLive: false,
    providerId: 'offline',
    isTeamLead: true,
    subAgentIds: ['sales-max', 'procurement-mira'],
    individualSkill: `# Finance Controller Protocol

## Routine
- Report cash on hand, inventory value, receivables, and payable risk.
- Flag deals below target margin before stock is released.
- Keep daily CEO brief concise and decision-oriented.
- Track overdue invoices and payment clearance.
`,
    sharedSkill: SHARED_SKILL
  },
  {
    id: 'ecommerce-kai',
    spriteId: 'xaugod',
    name: 'Kai (E-Commerce)',
    title: 'ONLINE STORE & MARKETPLACE OPS',
    avatar: '🛒',
    status: 'Working',
    department: 'Retail',
    mission: 'ดูแลหน้าร้านออนไลน์ marketplace ราคา และ conversion รายวัน',
    authorityLevel: 'Manager',
    description: 'จัดการ Shopee/Lazada/Facebook/LINE OA ตรวจคำสั่งซื้อรายย่อย อัปเดตราคา และซิงก์สต็อกออนไลน์',
    tools: 'Marketplace Sync, Listing Optimizer, Retail Order Queue',
    system: 'retail-commerce',
    reportsTo: 'CEO เจ',
    position: { left: '58%', top: '34%' },
    sessionId: 'ecommerce-kai',
    isLive: false,
    providerId: 'offline',
    individualSkill: `# E-Commerce Ops Protocol

## Routine
- Keep product listings accurate and searchable.
- Sync online stock after every wholesale or retail sale.
- Suggest bundles for slow-moving inventory.
- Escalate customer checkout or payment issues to Support and Finance.
`,
    sharedSkill: SHARED_SKILL
  },
  {
    id: 'success-aria',
    spriteId: 'jing',
    name: 'Aria (Customer Success)',
    title: 'CUSTOMER SUCCESS & ACCOUNT CARE',
    avatar: '🎧',
    status: 'Working',
    department: 'Customer Experience',
    mission: 'ดูแลลูกค้ารายใหญ่ ติดตามความพึงพอใจ และป้องกันการเสียลูกค้า',
    authorityLevel: 'Specialist',
    description: 'ติดตามลูกค้าหลังส่งสินค้า เก็บ feedback เปิด ticket เคลม และเสนอ upsell ที่เหมาะกับแต่ละบัญชีลูกค้า',
    tools: 'CRM Timeline, Renewal Reminder, Ticket Router',
    system: 'customer-success',
    reportsTo: 'CEO เจ',
    position: { left: '42%', top: '66%' },
    sessionId: 'success-aria',
    isLive: false,
    providerId: 'offline',
    individualSkill: `# Customer Success Protocol

## Routine
- Follow up after bulk delivery and confirm customer satisfaction.
- Route warranty or defect cases to Luna with complete context.
- Identify repeat buyers and recommend next offers.
- Keep customer notes accurate and concise.
`,
    sharedSkill: SHARED_SKILL
  }
];
