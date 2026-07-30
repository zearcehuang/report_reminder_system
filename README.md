# 📊 專案履約報告繳交提醒與 Outlook 會議發布系統 (Report Submission Reminder System)

本系統為專為政府與企業軟體專案設計的 **履約里程碑與 Outlook 會議預約發布引擎**。系統能自動依據合約/專案開工日 (D-Day) 推算各階段報告繳交死線，自動避開行政院人事行政總處 (DGPA) 辦公日曆表之例假日與國定假日，並支援 Microsoft Outlook 會議預約信件發布、.ics 檔案下載手動匯入 Outlook 行事曆，以及多角色專案團隊管理與標案合約文件智能關鍵日期解析。

---

## 🌟 系統主要特色

- 📅 **D-Day 履約里程碑自動推算與手動新增/修改**：
  - 自訂專案開工日 (D-Day)，自動計算 D+N 各階段履約報告繳交期限。
  - 支援手動新增履約報告、修改報告死線日期與 D+N 天數動態雙向同步。
- 🛡️ **DGPA 國定假日與例假日自動避開**：
  - 內建行政院人事行政總處辦公日曆，當報告死線落於週六、週日或國定假日/補假時，系統自動向後順延至下一個正常工作日。
- 📅 **Microsoft Outlook 會議預約發布與 .ics 匯入檔中心**：
  - 採用正統 Microsoft Outlook 會議邀請格式 (iCalendar v2.0 `ATTENDEE;RSVP=TRUE` 與 `BUSYSTATUS:BUSY`)。
  - **行事曆直連發送**：提供直連 Outlook 網頁版行事曆 (`https://outlook.office.com/calendar/0/deeplink/compose`)，點擊傳送後會議將自動呈現於全員 Outlook 行事曆中。
  - **.ics 會議檔下載**：支援一鍵下載具名 `.ics` 會議預約檔，雙擊即可開啟 Microsoft Outlook 桌面版自動匯入日曆。
  - **發布寄件者身份登入驗證**：發布前需完成寄件者帳號驗證登入，確保會議發布資訊之真實性與安全性。
- 👥 **多角色專案團隊名冊與一鍵多選**：
  - 支援新增與編輯多角色專案負責人團隊名冊（包含 PM 專案經理、業務 Sales、SA 系統分析師、PG 開發工程師、QA 測試經理、架構師等）。
  - 在履約里程碑規則與報告編輯視窗中，提供專案團隊角色「一鍵多選/全選」快速挑選功能。
- 🔄 **雙向狀態管理（標記為已繳交 / 改為未繳交）**：
  - 靈活切換里程碑報告之繳交狀態，即時更新儀表板與時間軸進度。
- 📄 **合約與標案文件智能上傳解析**：
  - 支援 `.docx`, `.pdf`, `.xlsx`, `.csv`, `.txt` 等標案規範與工作說明書 (RFP/SOW)，自動擷取關鍵條文與日期。
- 🎨 **明亮現代質感 UI (Bright Modern Light Theme)**：
  - 採用高閱讀性 Light Slate 色彩系統、Glassmorphism 視覺設計與極致微動畫。

---

## 🛠️ 技術架構 (Tech Stack)

- **前端 (Frontend)**：React 18, TypeScript, Vite, Lucide React (圖示庫), Vanilla CSS (Design Tokens & CSS Variables)
- **後端 (Backend)**：Node.js, Express 4.x, Multer (檔案上傳處理), CORS
- **資料儲存 (Data Storage)**：JSON 檔案儲存庫 (位於 `./data/` 目錄，包含 `projects.json`, `holidays.json`, `contacts.json`)

---

## 📦 環境需求 (Prerequisites)

- **Node.js**：`>= 18.0.0` (建議使用 18.x 或 20.x LTS)
- **npm**：`>= 8.0.0`
- **作業系統**：Windows / macOS / Linux

---

## 🚀 套件安裝說明 (Installation)

### Step 1: 下載專案與安裝根目錄（後端）套件

開啟終端機 (Terminal / Command Prompt / PowerShell)，進入專案根目錄並安裝依賴套件：

```bash
# 進入專案根目錄
cd report_reminder_system

# 安裝根目錄 (Express / Node.js) 相關套件
npm install
```

### Step 2: 安裝前端 React 套件

```bash
# 進入前端目錄
cd frontend

# 安裝前端 (React / TypeScript / Vite) 相關套件
npm install

# 回到專案根目錄
cd ..
```

---

## 🖥️ 服務啟動指南 (Running the Application)

系統支援兩種運行模式：

### 模式一：生產整合運行模式 (Recommended / Production Build - Port 5000)

在此模式下， Express 後端伺服器將同時處理 API 請求並靜態託管編譯後的前端頁面 (Port `5000`)。

```bash
# 1. 編譯前端專案 (生成 frontend/dist 檔案)
npm run build:frontend

# 2. 啟動後端伺服器 (包含靜態頁面託管)
npm start
```

啟動成功後，打開瀏覽器存取：
👉 **http://localhost:5000**

---

### 模式二：前端開發熱載入模式 (Development Mode - Port 3000 & 5000)

如果您正在進行前端畫面開發並希望修改程式碼後自動刷新畫面：

1. **啟動後端 API 伺服器 (Port 5000)**：
   ```bash
   npm start
   ```

2. **開啟另一個終端機視窗，啟動前端開發伺服器 (Port 3000)**：
   ```bash
   npm run dev:frontend
   ```

啟動成功後，打開瀏覽器存取：
👉 **http://localhost:3000** *(Vite 開發伺服器會自動將 `/api` 請求代理至 `http://localhost:5000`)*

---

## 📜 常用 NPM 指令彙整 (Available Scripts)

| 指令 | 說明 |
| :--- | :--- |
| `npm start` | 啟動 Node.js Express 後端伺服器 (`node server.js`) |
| `npm run dev:frontend` | 啟動 Vite 前端熱載入開發伺服器 |
| `npm run build:frontend` | 使用 TypeScript 與 Vite 建置前端生產版本 bundle |

---

## 📁 專案目錄結構 (Project Structure)

```text
report_reminder_system/
├── backend/                  # 後端模組與預留功能
├── data/                     # JSON 資料持久化儲存目錄
│   ├── projects.json         # 履約專案、團隊成員與里程碑規則資料
│   ├── holidays.json         # DGPA 政府辦公日曆資料
│   └── contacts.json         # 專案團隊通訊錄
├── frontend/                 # 前端 React TypeScript 專案
│   ├── dist/                 # 前端打包產出目錄 (Build 後生成)
│   ├── src/
│   │   ├── components/       # 介面元件 (ScheduleTimeline, OutlookMeetingModal, RuleManager, DDayControl, AddReportModal...)
│   │   ├── services/         # API 通訊與歸一化服務 (api.ts)
│   │   ├── types.ts          # TypeScript 型別定義
│   │   ├── App.tsx           # 主頁面元件
│   │   ├── main.tsx          # 前端入口點
│   │   └── index.css         # 明亮質感 CSS Design System
│   ├── package.json          # 前端 package.json
│   └── vite.config.ts        # Vite 設定檔 (包含 Proxy API 配置)
├── uploads/                  # 上傳之合約與標案文件儲存目錄
├── package.json              # 專案根目錄 package.json
├── server.js                 # Express 後端入口伺服器
└── README.md                 # 專案說明文件
```

---

## ❓ 常見問題與障礙排除 (Troubleshooting)

### Q1: 在 Windows PowerShell 執行 `npm` 指令出現 `UnauthorizedAccess` 錯誤？

**原因**：PowerShell 的 ExecutionPolicy 限制了 `.ps1` 腳本執行。  
**解決方案**：請改用 `cmd` 命令提示字元執行，或在命令前加上 `cmd /c`，例如：
```bash
cmd /c "npm run build:frontend"
cmd /c "npm start"
```

### Q2: 啟動時出現 `Error: listen EADDRINUSE: address already in use :::5000`？

**原因**：Port 5000 已被舊的 Node 程序或其他應用程式占用。  
**解決方案**：
1. 查詢占用 Port 5000 的 PID (Powershell)：
   ```powershell
   Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
   ```
2. 終止該程序：
   ```powershell
   Stop-Process -Id <PID> -Force
   ```
3. 重新執行 `npm start` 即可。

---

## 📄 授權條款 (License)

MIT License © 2026 專案履約報告繳交提醒系統團隊
