# 📊 專案履約報告繳交提醒與 Outlook 會議發布系統 (Report Submission Reminder System)

本系統為專為政府採購案與企業級專案量身打造的 **履約里程碑自動推算、Google Gemini AI 合約深度解析、Outlook 會議預約發布與背景定時排程通知引擎**。

系統能自動依據合約/專案開工日 (D-Day) 精確推算各階段履約報告繳交死線，自動避開行政院人事行政總處 (DGPA) 辦公日曆表之例假日與國定假日、正確識別彈性補班日，提供每日 **09:00 AM 背景自動定時排程預警與發送日誌中心**，並整合 **Google Gemini 3.7/3.6/2.5 AI 多模態合約五維度深度解析與互動預覽對話盒**、**🔐 AES-256-GCM 敏感憑證加密與動態模型配置**、**🛡️ 多角色權限控管 (RBAC) 與加鹽雜湊密碼安全防護**、**👤 使用者帳號與自訂權限矩陣維護中心**、Microsoft Outlook 會議邀請發布與多角色專案團隊名冊管理。

---

## 🌟 系統核心亮點與主要特色

### 🤖 1. 最新世代 Google Gemini AI 雙軌合約解析引擎 (`AiContractParser`)
- **多模型原生支援**：內建最新世代 **Google Gemini 3.7 Flash** (預設推薦)、**Gemini 3.6 Flash**、**Gemini 2.5 Flash**、**Gemini 2.5 Pro** 及自動綁定最新版之 `gemini-flash-latest`。
- **多模態檔案深度解析**：支援純文字檔、PDF (含掃描件多模態視覺辨識)、Word (`.docx`)、Excel/CSV (`.csv`) 等各類標案招標與契約文件。
- **合約五維度結構化欄位萃取**：
  1. 📌 **報告死線名稱** (Milestone Title)
  2. ⏱️ **D+N 相對天數與死線日期** (Day Offset & Deadline Date)
  3. 📦 **交付產出物清單** (Deliverables Checklist)
  4. ⚖️ **逾期違約罰則** (Penalty Terms & Daily Fine Rates)
  5. 📜 **契約條文依據** (Clause Reference & Page Index)
- **卡片式折疊預覽對話盒 (`DocumentPreviewModal`)**：提供五維度資訊即時折疊展開、現場行內編輯、單項剔除與一鍵勾選併入專案之完整互動體驗。
- **100% 離線高可用 Fallback 引擎**：若未配置 API Key 或遇到網路中斷，系統無縫切換至內建啟發式規則引擎 (Heuristic Rule Engine)，確保合約解析永遠可用。

### 🔐 2. AES-256-GCM 憑證加密與系統設定中心 (`cryptoService` & `SystemSettingsModal`)
- **AES-256-GCM 認證加密**：後端全面使用 AES-256-GCM (96-bit IV, 128-bit Auth Tag) 對儲存之敏感金鑰 (Gemini API Key) 進行對稱認證加密持久化，防篡改且不可逆還原。
- **安全前端遮罩**：API 回傳與前端介面嚴格套用安全遮罩（例如 `AIzaSy...****...xyz9`），杜絕金鑰在前端日誌或網路封包中外洩。
- **一鍵連線診斷與即時 Health Check**：提供即時 Ping 測試，自動量測並回傳 API 響應延遲毫秒數 (`latencyMs`) 與模型狀態回報。
- **Google 雲端可用模型即時探索**：支援動態向 Google Generative Language API 查詢當前 API Key 支援之最新模型清單，亦提供精選預設推薦清單。

### 🛡️ 3. 多角色權限控管 (RBAC) 與安全防護機制 (`authMiddleware`)
- **三層級角色防護矩陣**：
  - 👑 **Admin (系統最高管理員)**：全權存取（專案管理、DGPA 行事曆維護、使用者與權限矩陣維護、系統設定與 API Key 配置、背景排程手動觸發與日誌清空）。
  - 💼 **PM (專案經理)**：專案營運權限（D-Day 修改、履約報告編輯/產出物維護、合約解析上傳、Outlook 邀請派發與標記繳交）。
  - 👁️ **Auditor (合約審核員/查核人員)**：純唯讀觀看權限（履約時間軸瀏覽、.ics 下載、排程發送日誌審視，自動停用所有寫入/刪除按鈕）。
- **密碼 Hash 加密安全防護**：後端全面使用 HMAC-SHA256 加鹽雜湊演算法 (`hashPassword()`) 持久化使用者密碼，支援安全時序比對 (Timing-Safe Equal Comparison)。
- **JWT Bearer Token 簽署**：登入驗證發放加密 Token，後端 Middleware 全面保護敏感 API 端點，`fetchApi` 自動注入 Token 授權標頭。
- **頂部動態 Role Badge 與帳號切換對話盒 (`UserAuthModal`)**：提供一鍵切換預設測試帳號與即時角色警示徽章。

### 👤 4. 帳號與權限矩陣維護中心 (`UserPermissionModal`)
- **使用者帳號全功能 CRUD**：管理員可新增、編輯、刪除系統使用者帳號，並重設密碼與變更角色。
- **從通訊錄批次匯入帳號 (`ContactImportModal`)**：一鍵將專案團隊通訊錄 (`contacts.json`) 成員轉換匯入為正式登入帳號。
- **自訂角色與權限矩陣控制 (RBAC Matrix)**：支援自訂角色名稱與細粒度勾選 API 存取權限標籤（如 `projects:read`, `schedules:submit`, `rules:write`, `settings:write` 等）。

### ⏰ 5. 背景自動定時排程通知與發送日誌中心 (`SchedulerService` & `SchedulerLogModal`)
- **每日 09:00 AM 自動稽核**：後端常駐排程器每日固定掃描所有專案報告死線，依據提前 7, 3, 1 天及當天多重預警門檻，自動觸發通知。
- **雙通道派發**：配置 Webhook 自動推送 MS Teams 提醒卡片，並同步生成 Outlook 會議預約連結與發送日誌。
- **前端管理視窗 (`SchedulerLogModal`)**：提供即時連線狀態、上次檢查時間、歷史 Log 搜尋與「⚡ 立即掃描發送」手動觸發按鈕。

### 🚨 6. 系統異常與運作 Log 監控視窗 (`ErrorLogModal` & `errorLogger`)
- 提供後端 API 與背景服務運作日誌視覺化監控，支援 `ERROR` / `WARN` / `INFO` 級別過濾、詳細錯誤堆疊 (Stack Trace) 檢視與一鍵日誌清理。

### 📅 7. D-Day 履約里程碑自動推算與 DGPA 假日/補班日精確管理
- **開工日 (D-Day) 自動推算**：自訂專案開工日，自動計算 D+N 各階段履約報告繳交期限。
- **自動日期排序**：所有國定假日與補班日皆嚴格按日期 (YYYY-MM-DD) 升冪排序。
- **國定假日避開與補班日精確識別**：死線遇國定假日/例假日自動順延至下一工作日；遇 DGPA 補班日（如彈性放假之週六補班）自動識別為有效工作日，精確推算不誤延。
- **雙頁籤管理 UI (`HolidayManagementModal`)**：提供 `🌴 國定假日`、`💼 補班日` 與 `📅 全部明細` 分類頁籤，支援一鍵從 DGPA 同步與自訂新增放假/補班項目。

### 📅 8. Microsoft Outlook 會議預約發布與 .ics 匯入檔中心 (`OutlookMeetingModal`)
- 採用正統 Microsoft Outlook 會議邀請格式 (iCalendar v2.0 `ATTENDEE;RSVP=TRUE` 與 `BUSYSTATUS:BUSY`)。
- **行事曆直連發送**：直連 Outlook 網頁版行事曆 (`outlook.office.com/calendar/0/deeplink/compose`)，點擊傳送後會議自動呈現於全員 Outlook 行事曆中。
- **.ics 會議檔下載**：支援一鍵下載具名 `.ics` 會議預約檔，雙擊即可開啟 Microsoft Outlook 桌面版自動匯入日曆。
- **發布寄件者身份登入驗證**：發布前需完成寄件者帳號驗證登入，確保會議發布資訊之真實性與安全性。

### 👥 9. 多角色專案團隊名冊與一鍵多選
- 支援維護多角色專案團隊名冊（PM 專案經理、業務 Sales、SA 系統分析師、PG 開發工程師、QA 測試經理、架構師等）。
- 在履約里程碑規則與報告編輯視窗中，提供專案團隊角色「一鍵多選/全選」快速挑選功能。

### ⚡ 10. 全系統效能極致優化與極速響應 (Performance & Architecture Optimization)
- **Node.js 檔案 I/O 與記憶體優化**：採用原生 `structuredClone` 深拷貝替換傳統 JSON 序列化，修復 Promise 寫入鎖 (`fileLocks`) 記憶體自動釋放機制，並整合 HTTP 回應壓縮 (`compression`) 與靜態資源 `Cache-Control` 長效快取標頭。
- **React 細粒度渲染與動態 Code-Splitting**：全面於 `App.tsx` 導入 `useCallback` 配合子組件 `React.memo` 避免二次重繪 (Re-render)，並對重量級彈窗視窗導入 `React.lazy()` 與 `Suspense` 動態分割載入。
- **ASP.NET Core C# 異步與正則編譯最佳化**：全介面支援 `CancellationToken` 取消機制防止 Thread Pool Starvation，並採用 `static readonly` Compiled Regex 降低文本解析時的記憶體分配。

### 🎨 11. 明亮現代質感 UI (Bright Modern Light Theme)
- 採用高閱讀性 Light Slate 色彩系統、Glassmorphism 視覺設計與極致微動畫。
- 全數下拉選單（包含頂部導覽選單與全系統 `<select>` / `<option>`）進行高對比白底黑字與紫色選中樣式優化，提供最高水準的視覺體驗。

---

## 🛠️ 技術架構 (Tech Stack)

| 領域 | 技術與組件 |
| :--- | :--- |
| **前端 (Frontend)** | React 18 (`React.lazy` / Code-Splitting / `memo` / `useCallback`), TypeScript, Vite 5.x, Lucide React, Vanilla CSS (Design Tokens & CSS Variables), `useAppModals` 狀態管理 Hook, `fetchApi` 歸一化請求層 |
| **後端 (Backend)** | Node.js Express 4.x (模組化 `routes/`, `services/`, `middleware/`), `cryptoService` (AES-256-GCM), `compression` (Gzip HTTP 回應壓縮), `jsonwebtoken` (JWT 驗證), `joi` (Schema 輸入驗證), `asyncHandler` (全域 Async 錯誤捕獲), `passwordService` (HMAC-SHA256 密碼加鹽雜湊), `jsonStore` (structuredClone 深拷貝與 Promise 寫入鎖), `AiContractParser` (Gemini 3.7/3.6/2.5 多模型合約解析服務), `SchedulerService` (常駐背景定時排程器) |
| **.NET 擴充相容層** | C# .NET API/Tests 相容層 (`ReportReminder.Api`, `ReportReminder.Tests`, `CancellationToken` & Compiled Regex 優化) |
| **資料儲存 (Data Storage)** | JSON 檔案儲存庫與記憶體寫入快取 (位於 `./data/` 目錄，包含 `projects.json`, `holidays.json`, `contacts.json`, `notification_logs.json`, `users.json`, `roles.json`, `settings.json`, `errors.json`) |

---

## 📦 環境需求 (Prerequisites)

- **Node.js**：`>= 18.0.0` (建議使用 18.x 或 20.x LTS)
- **npm**：`>= 8.0.0`
- **作業系統**：Windows / macOS / Linux

---

## 🚀 套件安裝說明 (Installation)

### Step 1: 安裝專案根目錄（後端）套件

開啟終端機 (Terminal / PowerShell / Bash)，進入專案根目錄並安裝依賴套件：

```bash
# 進入專案根目錄
cd report_reminder_system

# 安裝根目錄 (Express / Node.js / Crypto) 相關套件
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

在此模式下，Express 後端伺服器將同時處理 API 請求、啟動背景自動定時排程器、RBAC 驗證與 Gemini AI 服務，並靜態託管編譯後的前端頁面 (Port `5000`)。

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
| `node backend/tests/gemini_and_encryption.test.js` | 執行 Gemini AI 多模型、AES-256-GCM 加密與設定診斷測試套件 |
| `npm run seed` | 初始化與重設專案測試資料庫 (`node backend/services/seedService.js`) |
| `npm run dev:frontend` | 啟動 Vite 前端熱載入開發伺服器 (Port 3000) |
| `npm run build:frontend` | 使用 TypeScript 與 Vite 建置前端生產版本 bundle (`frontend/dist/`) |

---

## 🧪 自動化測試套件 (Verification & Test Suites)

系統內建兩大自動化測試套件，確保核心演算法、AI 辨識、加密演算法與 API 端點 100% 穩定：

### 1. Gemini AI & AES-256-GCM 專項測試套件 (`gemini_and_encryption.test.js`)
驗證敏感金鑰加密與解密、金鑰遮罩、連線測試診斷、雲端模型探索與合約五維度解析：
```bash
node backend/tests/gemini_and_encryption.test.js
```
測試項目涵蓋：
- ✅ **AES-256-GCM 加密與解密正確性**
- ✅ **金鑰遮罩安全防護 (`AIzaSy...****`)**
- ✅ **竄改或無效密文容錯與安全捕捉**
- ✅ **系統設定持久化與遮罩讀取**
- ✅ **Gemini 連線測試與延遲 (Latency) 評測**
- ✅ **最新世代模型清單動態獲取**
- ✅ **離線啟發式 5 維度合約解析 Fallback 測試**
- ✅ **多格式文件 (`docxExtractor`) 整合解析**

### 2. 9 大全流程情境自動化驗證 (`test_scenarios.js`)
伺服器啟動於 Port 5000 時執行端到端業務情境測試：
```bash
# 確保 npm start 伺服器正在運行，接著在終端機執行：
node test_scenarios.js
```
測試情境涵蓋：
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

## 🔌 核心 API 端點清單 (Core API Endpoints)

| 模組 | HTTP 方法 | API 路徑 | 權限需求 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| **系統設定 (Settings)** | `GET` | `/api/settings` | 公開 / 登入 | 獲取系統公開設定與 Gemini 遮罩金鑰 |
| | `PUT` | `/api/settings` | `Admin` | 更新系統設定與 Gemini API Key (AES-256-GCM 加密) |
| | `POST` | `/api/settings/test-gemini` | `Admin` | 測試 Gemini API 連線狀態與延遲時間 |
| | `GET` | `/api/settings/gemini-models` | `Admin` | 獲取可用 Gemini 模型清單 (即時/推薦) |
| **合約解析 (Document)** | `POST` | `/api/documents/parse-contract` | `PM` / `Admin` | 上傳合約 (PDF/Word/CSV) 進行 AI 五維度解析 |
| **專案管理 (Projects)** | `GET` | `/api/projects` | `All` | 查詢所有專案清單與進度摘要 |
| | `POST` | `/api/projects` | `Admin` | 建立新專案 |
| | `PUT` | `/api/projects/:id/dday` | `PM` / `Admin` | 更新專案開工日 (D-Day) 並重算里程碑 |
| | `DELETE` | `/api/projects/:id` | `Admin` | 刪除單一專案 |
| **履約時程 (Schedules)** | `GET` | `/api/projects/:id/schedules` | `All` | 獲取專案所有推算之履約里程碑死線 |
| | `POST` | `/api/projects/:id/schedules/submit` | `PM` / `Admin` | 變更里程碑報告繳交狀態 (已繳交/未繳交) |
| **日曆與補班日 (Holidays)** | `GET` | `/api/holidays` | `All` | 獲取 DGPA 國定假日與彈性補班日清單 |
| | `POST` | `/api/holidays/sync` | `Admin` | 一鍵從 DGPA 同步最新政府行事曆 |
| **身份與授權 (Auth/Users)** | `POST` | `/api/auth/login` | 公開 | 使用者登入並取得 JWT Bearer Token |
| | `GET` | `/api/users` | `Admin` | 查詢系統使用者清單 |
| | `POST` | `/api/users` | `Admin` | 新增使用者帳號 (含密碼 Hash 加密) |
| **背景排程 (Scheduler)** | `GET` | `/api/scheduler/logs` | `Auditor` / `PM` / `Admin` | 查詢定時排程與預警通知發送日誌 |
| | `POST` | `/api/scheduler/trigger` | `Admin` | 手動立即觸發全系統報告死線掃描派發 |
| **系統監控 (Errors)** | `GET` | `/api/errors/logs` | `Admin` | 查詢系統錯誤與警示日誌 |
| | `DELETE` | `/api/errors/logs` | `Admin` | 清空系統日誌 |

---

## 📁 專案目錄結構 (Project Structure)

```text
report_reminder_system/
├── backend/                      # 後端核心模組與常駐服務
│   ├── routes/                   # 模組化 Express 路由控制器
│   │   ├── authRoutes.js         # 使用者登入認證與 Token 發放
│   │   ├── contactRoutes.js      # 團隊成員通訊錄維護
│   │   ├── documentRoutes.js     # 文件上傳與合約解析路由
│   │   ├── holidayRoutes.js      # DGPA 假日與補班日管理路由
│   │   ├── notificationRoutes.js # 提醒通知與 Webhook 發布
│   │   ├── projectRoutes.js      # 專案與里程碑資料維護
│   │   ├── roleRoutes.js         # RBAC 角色與權限矩陣路由
│   │   ├── scheduleRoutes.js     # 履約時程推算與狀態切換
│   │   ├── schedulerRoutes.js    # 常駐排程器手動觸發與狀態
│   │   ├── settingRoutes.js      # 系統設定、Gemini 金鑰與連線測試路由
│   │   └── userRoutes.js         # 使用者帳號 CRUD 維護
│   ├── services/                 # 核心業務邏輯與運算服務層
│   │   ├── calendarService.js    # D-Day 工作日/國定假日/補班日推算引擎
│   │   ├── cryptoService.js      # AES-256-GCM 敏感金鑰加密/解密/遮罩服務
│   │   ├── csvParser.js          # CSV 合約文件解析器
│   │   ├── docxExtractor.js      # Word (.docx) 文本與表格萃取器
│   │   ├── errorLogger.js        # 系統日誌紀錄與輪替服務
│   │   ├── jsonStore.js          # structuredClone 深拷貝與 Promise 寫入鎖儲存庫
│   │   ├── passwordService.js    # HMAC-SHA256 / scrypt 加鹽密碼雜湊
│   │   ├── projectService.js     # 專案計算、里程碑生成與排程邏輯
│   │   ├── seedService.js        # 測試資料種子建立與資料重置
│   │   └── settingService.js     # 系統設定管理、Gemini 連線測試與模型清單
│   ├── middleware/               # Express 中間件 (認證、驗證、錯誤攔截)
│   ├── errors/                   # 自訂業務例外類別 (Custom App Errors)
│   ├── tests/                    # 後端單元與專項測試套件
│   │   ├── gemini_and_encryption.test.js # Gemini AI 多模型與 AES-256-GCM 測試
│   │   ├── aiContractParser.test.js      # AI 合約五維度解析測試
│   │   ├── calendarService.test.js       # 假日/補班日工作日推算測試
│   │   ├── csvParser.test.js             # CSV 解析測試
│   │   ├── jsonStore.test.js             # JSON 檔案儲存鎖機制測試
│   │   └── passwordService.test.js       # 密碼雜湊與比對測試
│   ├── authMiddleware.js         # RBAC 角色權限控管與 JWT 驗證轉發
│   ├── AiContractParser.js       # Google Gemini 雙軌多模態五維度合約解析引擎
│   ├── SchedulerService.js       # 每日 09:00 AM 常駐背景定時排程引擎
│   ├── ReportReminder.Api/       # C# .NET API 擴充相容介面
│   ├── ReportReminder.Tests/     # C# .NET 單元與整合測試
│   └── ReportReminder.sln        # C# Visual Studio 解決方案檔
├── data/                         # JSON 資料持久化儲存目錄
│   ├── projects.json             # 履約專案、團隊成員與里程碑規則資料
│   ├── holidays.json             # DGPA 政府辦公日曆與補班日資料
│   ├── contacts.json             # 專案團隊通訊錄
│   ├── notification_logs.json    # 背景自動排程發送日誌
│   ├── users.json                # 系統使用者帳號與密碼 Hash 資料
│   ├── roles.json                # 系統 RBAC 角色與 API 權限矩陣
│   ├── settings.json             # 系統全域設定與 AES-256-GCM 加密金鑰
│   └── errors.json               # 系統運作與例外日誌
├── frontend/                     # 前端 React TypeScript 專案
│   ├── dist/                     # 前端打包產出目錄 (Build 後生成)
│   ├── src/
│   │   ├── components/           # 介面元件庫
│   │   │   ├── AddReportModal.tsx         # 新增履約報告對話盒
│   │   │   ├── ContactImportModal.tsx     # 通訊錄批次匯入帳號對話盒
│   │   │   ├── DDayControl.tsx            # D-Day 與預警頻率控制項
│   │   │   ├── DashboardSummary.tsx       # 儀表板總覽指標卡片
│   │   │   ├── DocumentPreviewModal.tsx   # AI 合約解析五維度預覽與編輯 Modal
│   │   │   ├── DocumentUploader.tsx       # 合約文件拖放上傳區
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
│   │   │   ├── SystemSettingsModal.tsx    # 系統設定、Gemini AI 與金鑰配置對話盒
│   │   │   ├── TeamsCardModal.tsx         # MS Teams 提醒卡片發送 Modal
│   │   │   ├── Toast.tsx                  # 全域通知提示訊息
│   │   │   ├── UserAuthModal.tsx          # 帳號登入與切換對話盒
│   │   │   └── UserPermissionModal.tsx    # 使用者與權限矩陣維護對話盒
│   │   ├── services/             # API 通訊與客戶端診斷服務
│   │   │   ├── api.ts            # 歸一化 fetchApi 服務層與網路通訊邏輯
│   │   │   ├── mockData.ts       # 離線/Fallback 模組化資料集
│   │   │   └── logger.ts         # 前端系統 Log 紀錄與診斷服務
│   │   ├── types.ts              # TypeScript 全域型別定義
│   │   ├── App.tsx               # 主頁面入口元件 (React.lazy & Suspense)
│   │   ├── main.tsx              # 前端入口點
│   │   └── index.css             # 明亮質感 CSS Design System
│   ├── package.json              # 前端 package.json
│   └── vite.config.ts            # Vite 設定檔 (含 Proxy API 配置)
├── uploads/                      # 上傳之合約與標案文件暫存目錄
├── package.json                  # 專案根目錄 package.json
├── server.js                     # Express 後端主伺服器入口
├── test_scenarios.js             # 9 大全流程情境整合驗證腳本
└── README.md                     # 專案說明文件
```

---

## 📄 授權條款 (License)

MIT License © 2026 專案履約報告繳交提醒與 Outlook 會議發布系統團隊
