# 📊 專案履約報告繳交提醒與 Outlook 會議發布系統 (Report Submission Reminder System)

本系統為專為政府與企業軟體專案設計的 **履約里程碑與 Outlook 會議預約發布引擎**。系統機能自動依據合約/專案開工日 (D-Day) 推算各階段報告繳交死線，自動避開行政院人事行政總處 (DGPA) 辦公日曆表之例假日與國定假日、正確識別彈性補班日，提供每日 **09:00 AM 背景自動定時排程通知與發送日誌中心**，並整合 **AI 標案合約五維度深度解析與互動預覽對話盒**、**🔐 多角色權限控管 (RBAC) 與密碼 Hash 安全加固機制**、**👤 使用者帳號與自訂權限矩陣維護中心**、Microsoft Outlook 會議預約信件發布與多角色專案團隊管理。

---

## 🌟 系統主要特色

- 🔐 **多角色權限控管 (RBAC) 與密碼 Hash 安全加固 (`authMiddleware`)**：
  - **三層級權限防護矩陣**：
    - 👑 **Admin (系統最高管理員)**：全權存取 (全刪寫權限、專案管理、DGPA 行事曆維護、使用者與權限矩陣維護、背景排程觸發與 Log 清空)。
    - 💼 **PM (專案經理)**：專案營運權限 (D-Day 修改、履約報告編輯/產出物維護、合約解析上傳、Outlook 邀請派發與標記繳交)。
    - 👁️ **Auditor (合約審核員/查核人員)**：純唯讀觀看權限 (履約時間軸瀏覽、.ics 下載、排程發送日誌審視，自動停用所有寫入/刪除按鈕)。
  - **密碼 Hash 加密與防護**：後端全面使用 HMAC-SHA256 加鹽雜湊演算法 (`hashPassword()`) 持久化使用者密碼，摒棄明文儲存，支援安全時序比對 (Timing-Safe Comparison)。
  - **JWT Bearer Token 簽署**：登入驗證發放加密 Token，後端 Middleware 全面保護敏感 API 端點，`fetchApi` 自動注入 Token 授權標頭。
  - **頂部動態 Role Badge 與帳號切換對話盒 (`UserAuthModal`)**：提供一鍵切換預設測試帳號與即時角色警示徽章。
- 👤 **帳號與權限矩陣維護中心 (`UserPermissionModal`)**：
  - **使用者帳號全功能 CRUD**：管理員可新增、編輯、刪除系統使用者帳號，並重設密碼與變更角色。
  - **從通訊錄批次匯入帳號 (`ContactImportModal`)**：一鍵將專案團隊通訊錄 (`contacts.json`) 成員轉換匯入為正式登入帳號。
  - **自訂角色與權限矩陣控制 (RBAC Matrix)**：支援自訂角色名稱與細粒度勾選 API 存取權限標籤 (如 `projects:read`, `schedules:submit`, `rules:write` 等)。
- 🤖 **AI 標案合約文件五維度深度解析 (`AiContractParser`)**：
  - **雙軌智能解析架構**：優先呼叫 AI 進行全文本結構化解析，並提供無縫切換的啟發式規則 Fallback 引擎，確保 100% 解析可靠度。
  - **合約五維度欄位萃取**：精確解析「報告死線名稱」、「D+N 相對天數」、「📦 交付產出物清單 (Deliverables)」、「⚖️ 逾期違約罰則 (Penalty Terms)」與「📜 條文依據 (Clause Reference)」。
  - **卡片式折疊預覽對話盒 (`DocumentPreviewModal`)**：提供五維度資訊可折疊展開、現場行內編輯與一鍵勾選併入專案之完整體驗。
- ⏰ **背景自動定時排程通知與發送日誌中心 (Automated Background Scheduler & Logs)**：
  - **每日 09:00 AM 自動稽核**：後端常駐排程器每日固定掃描所有專案報告死線，依據提前 7, 3, 1 天及當天多重預警門檻，自動觸發通知。
  - **雙通道派發**：配置 Webhook 自動推送 MS Teams 提醒卡片，並同步生成 Outlook 會議預約連結與發送日誌。
  - **前端管理視窗 (`SchedulerLogModal`)**：提供即時連線狀態、上次檢查時間、歷史 Log 搜尋與「⚡ 立即掃描發送」手動觸發按鈕。
- 🚨 **系統異常與運作 Log 監控視窗 (`ErrorLogModal`)**：
  - 提供後端 API 與背景服務運作日誌視覺化監控，支援 `ERROR` / `WARN` / `INFO` 級別過濾與一鍵日誌清理。
- 📅 **D-Day 履約里程碑自動推算與手動新增/修改**：
  - 自訂專案開工日 (D-Day)，自動計算 D+N 各階段履約報告繳交期限。
  - 支援手動新增與編輯履約報告對話盒 (`AddReportModal`, `EditReportModal`)、死線日期與 D+N 天數動態雙向同步。
- 🛡️ **DGPA 國定假日與彈性補班日精確管理與自動避開**：
  - **自動日期排序**：所有國定假日與補班日皆嚴格按日期 (YYYY-MM-DD) 升冪排序。
  - **列出假日/補班日名稱**：自動過濾無效常規例假日，清晰呈現國定假日名稱（如：元旦、除夕、春節、清明節、端午節、中秋節、國慶日等）與彈性補班日說明。
  - **補班日正確識別**：死線遇國定假日/例假日自動順延至下一工作日；遇 DGPA 補班日（如彈性放假之週六補班）自動識別為有效工作日，精確推算不誤延。
  - **雙頁籤管理 UI (`HolidayManagementModal`)**：提供 `🌴 國定假日`、`💼 補班日` 與 `📅 全部明細` 分類頁籤，支援一鍵從 DGPA 同步與自訂新增放假/補班項目。
- 📅 **Microsoft Outlook 會議預約發布與 .ics 匯入檔中心 (`OutlookMeetingModal`)**：
  - 採用正統 Microsoft Outlook 會議邀請格式 (iCalendar v2.0 `ATTENDEE;RSVP=TRUE` 與 `BUSYSTATUS:BUSY`)。
  - **行事曆直連發送**：提供直連 Outlook 網頁版行事曆 (`https://outlook.office.com/calendar/0/deeplink/compose`)，點擊傳送後會議將自動呈現於全員 Outlook 行事曆中。
  - **.ics 會議檔下載**：支援一鍵下載具名 `.ics` 會議預約檔，雙擊即可開啟 Microsoft Outlook 桌面版自動匯入日曆。
  - **發布寄件者身份登入驗證**：發布前需完成寄件者帳號驗證登入，確保會議發布資訊之真實性與安全性。
- 👥 **多角色專案團隊名冊與一鍵多選**：
  - 支援新增與編輯多角色專案負責人團隊名冊（包含 PM 專案經理、業務 Sales、SA 系統分析師、PG 開發工程師、QA 測試經理、架構師等）。
  - 在履約里程碑規則與報告編輯視窗中，提供專案團隊角色「一鍵多選/全選」快速挑選功能。
- 🔄 **雙向狀態管理（標記為已繳交 / 改為未繳交）**：
  - 靈活切換里程碑報告之繳交狀態，即時更新儀表板與時間軸進度。
- 🎨 **明亮現代質感 UI 與 Dropdown 高對比配色 (Bright Modern Light Theme)**：
  - 採用高閱讀性 Light Slate 色彩系統、Glassmorphism 視覺設計與極致微動畫。
  - 全數下拉選單（包含頂部導覽選單與全系統 `<select>` / `<option>`）進行高對比白底黑字與紫色選中樣式優化，解決深色模式下文字不可見之體驗瑕疵。

---

## 🛠️ 技術架構 (Tech Stack)

- **前端 (Frontend)**：React 18, TypeScript, Vite 5.x, Lucide React (圖示庫), Vanilla CSS (Design Tokens & CSS Variables), `useAppModals` 狀態管理 Hook, `fetchApi` 歸一化請求層
- **後端 (Backend)**：Node.js Express 4.x (模組化 `routes/`, `services/`, `middleware/`), `jsonwebtoken` (JWT 驗證), `joi` (Schema 輸入驗證), `asyncHandler` (全域 Async 錯誤捕獲), `passwordService` (scrypt 密碼 Hash 雜湊), `AiContractParser` (五維度合約解析服務), `SchedulerService` (常駐背景排程器), C# .NET API/Tests 相容層 (`ReportReminder.Api`, `ReportReminder.Tests`)
- **資料儲存 (Data Storage)**：JSON 檔案儲存庫與記憶體寫入快取 (位於 `./data/` 目錄，包含 `projects.json`, `holidays.json`, `contacts.json`, `notification_logs.json`, `users.json`, `roles.json`)

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

在此模式下， Express 後端伺服器將同時處理 API 請求、啟動背景自動定時排程器與 RBAC 驗證，並靜態託管編譯後的前端頁面 (Port `5000`)。

```bash
# 1. 編譯前端專案 (生成 frontend/dist 檔案)
npm run build:frontend

# 2. 啟動後端伺服器 (包含背景自動排程器與靜態頁面託管)
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
| `npm start` | 啟動 Node.js Express 後端伺服器與背景自動排程引擎 (`node server.js`) |
| `npm test` | 執行 9 大全流程情境自動化驗證測試套件 (`node test_scenarios.js`) |
| `npm run dev:frontend` | 啟動 Vite 前端熱載入開發伺服器 |
| `npm run build:frontend` | 使用 TypeScript 與 Vite 建置前端生產版本 bundle |

> 💡 **提示**：若在 Windows PowerShell 環境遇到指令執行權限限制 (Execution Policy restriction)，可以直接使用 `node test_scenarios.js` 執行測試套件。

---

## 🧪 自動化情境測試 (Automated Verification Suite)

本系統內建完整全流程自動化測試腳本 (`test_scenarios.js`)，涵蓋 9 大核心情境驗證，測試通過率 **100%**：

```bash
node test_scenarios.js
```

### 測試情境一覽：
1. **[Scenario 1] 標準專案創建、D+N 里程碑計算與 DGPA 國定假日/補班日順延**
2. **[Scenario 2] AI 5-Dimension 標案合約文件深度解析與互動預覽對話盒**
3. **[Scenario 3] 寄件者身份驗證登入與正統 Outlook 會議邀請 (.ics) 派發**
4. **[Scenario 4] 單一與批次專案刪除隔離測試**
5. **[Scenario 5] 里程碑報告單一與批次刪除同步測試**
6. **[Scenario 6] 多角色專案團隊名冊與行內編輯同步驗證**
7. **[Scenario 7] 背景自動定時排程引擎即時掃描與 Notification Logs 驗證**
8. **[Scenario 8] RBAC 登入驗證、JWT Bearer Token 與 3 層級角色權限保護驗證**
9. **[Scenario 9] 使用者維護 CRUD、通訊錄匯入帳號與自訂角色權限矩陣驗證**

---

## 📁 專案目錄結構 (Project Structure)

```text
report_reminder_system/
├── backend/                  # 後端模組與常駐服務
│   ├── authMiddleware.js     # RBAC 角色權限控管、JWT 驗證與密碼 Hash
│   ├── AiContractParser.js   # AI 雙軌合約五維度深度解析引擎
│   ├── SchedulerService.js   # 背景自動定時排程與通知發送引擎
│   ├── ReportReminder.Api/   # C# .NET API 擴充介面與服務
│   ├── ReportReminder.Tests/ # C# .NET 單元與整合測試
│   └── ReportReminder.sln    # C# Visual Studio 解決方案檔
├── data/                     # JSON 資料持久化儲存目錄
│   ├── projects.json         # 履約專案、團隊成員與里程碑規則資料
│   ├── holidays.json         # DGPA 政府辦公日曆與補班日資料
│   ├── contacts.json         # 專案團隊通訊錄
│   ├── notification_logs.json# 背景自動排程發送日誌
│   ├── users.json            # 系統使用者帳號與認密碼 Hash 資料
│   └── roles.json            # 系統 RBAC 角色與 API 權限矩陣
├── frontend/                 # 前端 React TypeScript 專案
│   ├── dist/                 # 前端打包產出目錄 (Build 後生成)
│   ├── src/
│   │   ├── components/       # 介面元件庫
│   │   │   ├── AddReportModal.tsx         # 新增履約報告對話盒
│   │   │   ├── ContactImportModal.tsx     # 通訊錄批次匯入對話盒
│   │   │   ├── DDayControl.tsx            # D-Day 與預警頻率控制項
│   │   │   ├── DocumentPreviewModal.tsx   # AI 合約解析五維度預覽 Modal
│   │   │   ├── DocumentUploader.tsx       # 合約文件拖曳上傳拖放區
│   │   │   ├── EditReportModal.tsx        # 編輯履約報告對話盒
│   │   │   ├── ErrorBoundary.tsx          # 前端錯誤攔截與復原頁面
│   │   │   ├── ErrorLogModal.tsx          # 系統異常日誌監控對話盒
│   │   │   ├── HolidayManagementModal.tsx # DGPA 國定假日與補班日 Modal
│   │   │   ├── Navbar.tsx                 # 頂部導覽列與功能按鈕區
│   │   │   ├── OutlookMeetingModal.tsx    # Outlook 會議預約發布對話盒
│   │   │   ├── ProjectManagerModal.tsx    # 專案管理與維護 Modal
│   │   │   ├── ProjectSwitcher.tsx        # 專案切換下拉選單
│   │   │   ├── RuleManager.tsx            # D+N 里程碑規則管理面板
│   │   │   ├── ScheduleTimeline.tsx       # 里程碑時間軸與繳交狀態
│   │   │   ├── SchedulerLogModal.tsx      # 背景排程日誌與立即掃描 Modal
│   │   │   ├── TeamsCardModal.tsx         # MS Teams 提醒卡片發送 Modal
│   │   │   ├── UserAuthModal.tsx          # 帳號登入與切換對話盒
│   │   │   └── UserPermissionModal.tsx    # 使用者與權限矩陣維護對話盒
│   │   ├── services/         # API 通訊與數據處理服務
│   │   │   ├── api.ts        # 歸一化 fetchApi 服務層與網路通訊邏輯
│   │   │   ├── mockData.ts   # 離線/Fallback 模組化資料集
│   │   │   └── logger.ts     # 前前端系統 Log 紀錄與診斷服務
│   │   ├── types.ts          # TypeScript 型別定義 (包含 UserRole & UserSession)
│   │   ├── App.tsx           # 主頁面入口元件
│   │   ├── main.tsx          # 前端入口點
│   │   └── index.css         # 明亮質感 CSS Design System
│   ├── package.json          # 前端 package.json
│   └── vite.config.ts        # Vite 設定檔 (包含 Proxy API 配置)
├── uploads/                  # 上傳之合約與標案文件儲存目錄
├── package.json              # 專案根目錄 package.json
├── server.js                 # Express 後端入口伺服器
├── test_scenarios.js         # 9 大全流程情境自動化測試套件
├── implementation_plan.md    # 系統架構與實作計畫規格書
└── README.md                 # 專案說明文件
```

---

## 📄 授權條款 (License)

MIT License © 2026 專案履約報告繳交提醒與 Outlook 會議發布系統團隊
