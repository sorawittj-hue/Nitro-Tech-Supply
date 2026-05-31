# 🏢 Nitro Tech Supply - AI-Powered IT Hardware Hub

**Nitro Tech Supply** คือแพลตฟอร์มระบบริหารจัดการการค้าส่งและค้าปลีกชิ้นส่วนไอทีระดับพรีเมียม (IT Hardware Wholesale & Retail Dashboard) ที่ทำงานร่วมกับทีมผู้ช่วยปัญญาประดิษฐ์ (AI Swarm Team) ในรูปแบบของ Pixel Dashboard ที่สวยงาม รองรับการแสดงผลทุกอุปกรณ์แบบ Responsive PWA และเชื่อมต่อกับระบบฐานข้อมูลจริงพร้อมระบบสมองกล Google Gemini API

---

## 🌟 ฟีเจอร์หลัก (Key Features)

### 1. 🤖 ทีมผู้ช่วย AI Swarm (AI Agent Swarm)
ระบบจำลองทีมทำงาน AI ที่คอยจัดการธุรการต่าง ๆ ภายในร้านและรายงานผลให้บอส (CEO เจ) ทราบ:
*   **CEO เจ (Sorawit)**: ผู้ดูแลระบบและสั่งการภาพรวม
*   **Max (B2B Sales)**: เจรจาดีลขายส่งล็อตใหญ่ ปิดการขาย คำนวณมาร์จินกำไร
*   **Atlas (Warehouse)**: ผู้จัดการคลังสินค้า ดูแลระบบ RFID ตรวจเช็คและสั่งเติมสต็อกอัตโนมัติ
*   **Luna (Support & QA)**: ฝ่ายเทคนิค QA ตรวจสอบการเคลมและการทำ Benchmark อุปกรณ์
*   **Nova (Marketing)**: ฝ่ายการตลาดและตั้งราคา วิเคราะห์คู่แข่งและสร้างโปรโมชั่น
*   **Orion (Logistics)**: ดูแลการนำเข้า-ส่งออก เอกสารศุลกากร และติดตามพัสดุ
*   *ระบบตรวจจับการงีบหลับ*: บอทบางตัวอาจแอบงีบหลับ (Napping) ซึ่งหัวหน้า (CEO) สามารถกดปลุก (Wake up) เพื่อให้พวกเขากลับมาทำงานต่อได้ทันที!

### 2. 📊 ระบบการเงินและการจัดส่งแบบ Real-time
*   **Company Capital**: คำนวณสินทรัพย์รวมของบริษัทแบบสด ๆ (คำนวณจาก Cash on Hand + Inventory Value + Accounts Receivable จากออเดอร์ที่รออนุมัติ)
*   **Live Inventory**: ระบบสต็อกสินค้าไอทีแบบ Dynamic ที่เชื่อมต่อฐานข้อมูลตรง เมื่อสต็อกลดลงหรือเพิ่มขึ้น มูลค่าคลังสินค้าจะคำนวณใหม่และแสดงผลทันที
*   **Sales Analytics**: กราฟแสดงรายได้สะสม (Revenue Growth) และปริมาณการขายรายวัน (Daily Order Volumes) ที่ดึงข้อมูลจากยอดซื้อขายจริงในฐานข้อมูล

### 3. 💬 Team Chat & AI Integration (Google Gemini API)
*   คุยกับทีมบอทไอทีของคุณได้โดยตรงผ่านหน้า **Team Chat**
*   เชื่อมต่อกับ **Google Gemini API** (โมเดลแนะนำ: `gemini-3-flash-preview`) เพื่อประมวลผลให้บอทในทีมสลับกันมาตอบคำถามและรับคำสั่งงานของบอสอย่างชาญฉลาดและมีความเป็นมนุษย์

### 4. 🔌 โหมดออฟไลน์สำรอง (Resilient Offline Mode)
*   หากระบบไม่สามารถเชื่อมต่อฐานข้อมูลหลัก (`json-server`) ได้ ระบบจะทำการเปิด **Offline Mode** โดยอัตโนมัติ 
*   ระบบจะดึงข้อมูลสำรองขึ้นมาแสดงผล และผู้ใช้ยังสามารถเพิ่ม/ลบ/แก้ไขสต็อกสินค้าบนเว็บบราวเซอร์ได้ตามปกติในแบบ In-Memory พร้อมแสดงการแจ้งเตือนรูปแบบ Toast โหมดออฟไลน์อย่างปลอดภัยโดยไม่มีการแครช

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

*   **Frontend**: React 19, TypeScript, Vite, Vanilla CSS (Custom design system, pixel art graphics)
*   **Backend Database**: JSON Server (สำหรับจำลอง REST API ที่รวดเร็ว)
*   **AI Integration**: Google Gemini API (ผ่าน REST API endpoint หรือ `@google/genai` SDK)
*   **Data Visualization**: Recharts (สำหรับการทำกราฟแสดงวิเคราะห์การเงิน)

---

## 🚀 เริ่มต้นใช้งาน (Getting Started)

### 1. โคลนโปรเจกต์และติดตั้ง Dependency
```bash
npm install
```

### 2. ตั้งค่าไฟล์สภาพแวดล้อม (Environment Variables)
คัดลอกไฟล์ `.env.example` เพื่อสร้างไฟล์ `.env` สำหรับกำหนด URL ปลายทางของ API:
```bash
cp .env.example .env
```
*(ในเครื่องพัฒนาโลคอล ค่าเริ่มต้นจะเป็น `VITE_API_BASE_URL=http://localhost:3001`)*

### 3. เริ่มรันระบบ
ในการรันพัฒนา ให้รันทั้ง Frontend (Vite) และ Backend (json-server) พร้อมกันผ่าน Concurrently:
```bash
npm run dev:all
```
ระบบจะเปิดบริการดังนี้:
*   **Frontend (Vite)**: [http://localhost:5173](http://localhost:5173)
*   **Backend (REST API)**: [http://localhost:3001](http://localhost:3001)

---

## ⚙️ การตั้งค่า AI (Google Gemini API)
1. ไปที่หน้า **Settings** (รูปฟันเฟืองด้านล่างขวา)
2. ใส่ **Google Gemini API Key** ของคุณ (ได้จาก Google AI Studio)
3. เลือกโมเดลที่ต้องการใช้งาน (เช่น `gemini-3-flash-preview`)
4. บันทึกการตั้งค่าเพื่อเริ่มคุยกับทีมงาน AI ในส่วนของ **Team Chat** ได้ทันที!
