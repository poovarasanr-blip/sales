# Backend API Requirement Specification
### Sales Incentive Web Application — Frontend-only UI Analysis

**Prepared for:** Backend team
**Prepared from:** Static analysis of the existing React/TypeScript frontend (`D:\Client\SalesIncentive\sales`). No backend code exists yet; the frontend currently runs on hardcoded JSON mocks and client-side Excel parsing.
**Do not treat this as already-built.** Nothing here is implemented server-side today — every endpoint below is a requirement derived from what the UI displays, edits, filters, or otherwise needs to function.

---

## 1. How to read this document

Every API entry is tagged with one of three labels:

- **Confirmed from UI** — the screen, field, action, or interaction literally exists in the current code (a rendered column, a wired `onClick`, a `TODO` comment naming the exact call to make, or a populated mock-data shape). These are not guesses.
- **Suggested** — a reasonable, standard way to make an already-visible feature actually work against a real backend (e.g., turning client-side array slicing into real `page`/`pageSize` query params, or adding a GET-list endpoint for a page that currently only has data via one-time bulk upload). Nothing here invents a feature that isn't visible in the UI — it only proposes how the visible feature should be served.
- **Needs Backend Confirmation** — the UI shows an affordance (an icon, a button, a stub component) with no wired behavior behind it, so the exact contract (request body shape, whether a reason is mandatory, what "success" returns) cannot be determined from the frontend alone. These are flagged explicitly rather than guessed.

Field names below are **normalized** for consistency (per your instruction to keep naming consistent app-wide). The current codebase itself is **not** consistent — e.g., an employee is `"Employee Code"` in one mock file and `EmployeeId` in another. Every such inconsistency is called out in §4 so your team knows it's a deliberate normalization, not an error in this document.

---

## 2. Scope & methodology

The entire frontend was read end-to-end: every route in `routes.tsx`, every page component, every shared table/filter/modal component, every config file that drives table columns, and every mock JSON file that stands in for real API data today. Modules covered:

| # | Module | Route(s) | Current state in code |
|---|---|---|---|
| 1 | Dashboard | `/` | Fully built, reads one static JSON (`dashboardConfig.json`) |
| 2 | Products | `/product`, `/bulkUpload` | Fully built, in-memory only (no GET on load) |
| 3 | Employee Sales Target | `/employeeSales`, `/employeeSalesTarget/bulkUpload` | Fully built, in-memory only |
| 4 | Actual Sales | `/actualSales`, `/actualSales/bulkUpload` | Fully built, in-memory only |
| 5 | Incentive | `/incentive` | Fully built, initializes from static mock, has an explicit `TODO` for a real API call |
| 6 | Sales (approval) | Sidebar links to `/Sales`, **but this route does not exist in `routes.tsx` yet** — `SalesList.tsx`, `SalesDetail.tsx`, `Modals/ApproveModal.tsx` are all empty stubs. Fully-specified mock data (`salesConfig.json`) and layout config (`pageLayout.json`) already exist, so the intended feature set is knowable even though no UI logic has been written. | — |
| 7 | Shared shell | Header, Sidebar (all pages) | Static nav + decorative header controls |

No login/authentication screen exists anywhere in this codebase today (a prior session-listener implementation was started and then explicitly reverted by the client). Because of that, §5.1 below is intentionally minimal and marked **Needs Backend Confirmation** rather than a fabricated login flow — including a full auth spec would violate "do not invent functionality that does not exist in the UI."

---

## 3. Naming & convention decisions (apply consistently across all APIs)

| Concept | Inconsistent forms found in current code | Normalized field to use everywhere |
|---|---|---|
| Employee identifier | `"Employee Code"` (bulk upload rows), `EmployeeId` (salesConfig/actualSalesConfig JSON) | `employeeCode` (string, e.g. `"PS0019"`) |
| Employee name | `"Employee Name"`, `EmployeeName` | `employeeName` |
| Manager identifier | `"Manager Code"`, `ManagerId` | `managerCode` |
| Manager name | `"Manager Name"`, `ManagerName` | `managerName` |
| Dealer/store | `Dealer`, `StoreName`, `Company`+`Location` (two separate fields in bulk-upload rows) | `dealerName` for the free-text store label; keep `company` / `location` where the bulk-upload template genuinely has them as separate columns |
| Product category | Free-text string everywhere it's used transactionally (`Category`, `SalesProductName`), but a **real relational hierarchy with numeric IDs already exists** in `productsConfig.json` (`CategoryId` → `SubCategoryId` → `ProductId`) | Transactional records should carry `categoryId` (FK to the Products master) in addition to the human-readable `categoryName`, so Employee Target / Actual Sales / Incentive / Sales all resolve against one source of truth instead of re-typing category names as strings. Flagged as **Suggested** — this is a normalization recommendation, not something already wired in the UI. |
| Month filter | Always a single month, never a range, displayed as `"May 2026"` | API parameter `month` as `YYYY-MM` (e.g. `"2026-05"`); the frontend datepicker already only lets the user pick a month, so converting its display label to ISO is a frontend-side concern, not a backend one |
| Achievement / performance | `AchievementPercentage: "84.44%"` (Sales), `Performance: "86-90%"` (Dashboard/TeamSales) — one is a raw percentage, the other a pre-bucketed band | Backend should return the **raw percentage** (`achievementPercentage: number`, e.g. `84.44`) and let the frontend bucket it against the legend thresholds (80–85 / 86–90 / 100+) shown in the UI. Do not pre-bucket server-side — the legend's thresholds are a display concern that could change. |
| Currency amounts | `IncentiveAmount`, `ActualIncentiveAmount`, `AdjustmentAmount`, `FinalIncentiveAmount` (all `number`, ₹, no currency-code field anywhere) | Keep as plain numbers in minor-or-major unit consistent with existing mocks (major unit, i.e. rupees not paise) unless your backend standard differs |

---

## 4. Cross-cutting / shared APIs

These are used by more than one page. Build them once.

### 4.1 Current-user / session — **Needs Backend Confirmation**
The header renders a "Manager" role badge and an avatar defaulting to initials `"SJ"`, implying a logged-in user, but **no login screen exists anywhere in this app**, and no session/token handling code is wired (a prior attempt was built and then fully reverted). Do not build a full auth flow from this document alone — confirm with the client whether authentication is out of scope for this phase or pending a separate spec.

| | |
|---|---|
| **Suggested (minimal)** | `GET /api/auth/me` |
| Response fields | `{ userId, name, initials, role, avatarUrl? }` |

### 4.2 Managers master list — **Confirmed from UI (reused 4×)**
The "Managers" dropdown appears with identical shape on Employee Sales Target, Actual Sales, Incentive, and Sales filter cards. Today each page derives it client-side from whatever rows happen to be loaded (`getManagerOptions()`), or from a hardcoded list in `pageLayout.json`. This should be one real master-data endpoint.

| | |
|---|---|
| **API name** | Get Managers |
| **Method** | GET |
| **Endpoint** | `/api/masters/managers` |
| **Query params** | none required; optional `search` for type-ahead |
| **Response fields** | `{ data: [ { managerCode, managerName } ], includesAllOption: true }` — the UI always prepends a synthetic `"All"` option (`value: ""`) itself |

### 4.3 Product category master (hierarchy) — **Confirmed from UI (`productsConfig.json`)**
This is the richest, most relationally-complete mock in the app and is the natural master data source for every other module's "Category" field.

| | |
|---|---|
| **API name** | Get Product Category Tree |
| **Method** | GET |
| **Endpoint** | `/api/masters/product-categories` |
| **Query params** | `search` (optional, matches category/sub-category/product name) |
| **Response fields** | `{ data: [ { categoryId, categoryName, code, targetQuantity, actualQuantity, eligibleIncentive, description, companyId, clientId, status, subCategories: [ { subCategoryId, subCategoryName, code, description, categoryId, companyId, clientId, status, products: [ { productId, productCode, productName, description, categoryId, subCategoryId, price, effectiveDate, eligibleIncentive, companyId, clientId, status, createdBy, createdOn } ] } ] } ] }` |

### 4.4 Dealer/branch master — **Confirmed from UI**
Dashboard's "Sales – Dealer" widget has a dropdown (`DropdownData: ["Vasanth & Co - Chennai", "Vasanth & Co - Benglore"]`); the `onChange` handler is currently an unimplemented stub (`throw new Error("Function not implemented.")`), so the exact selection behavior is **Needs Backend Confirmation**, but the master list itself is confirmed.

| | |
|---|---|
| **API name** | Get Dealers |
| **Method** | GET |
| **Endpoint** | `/api/masters/dealers` |
| **Response fields** | `{ data: [ { dealerId, dealerName } ] }` |

### 4.5 Excel export — **Suggested, appears identically on 5 pages**
Products, Employee Sales Target, Actual Sales, Incentive, and (per `pageLayout.json`) Sales all have a "Download Excel" button. Today it's 100% client-side (re-serializes whatever rows are already in memory via `xlsx`); this only becomes a real API need once lists are server-paginated, since the export must cover the full filtered set, not just the current page.

| | |
|---|---|
| **Pattern** | `GET /api/{resource}/export` with the **same filter/search query params as that resource's list endpoint**, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

### 4.6 Bulk upload — **Confirmed pattern, appears identically 3×** (Products, Employee Sales Target, Actual Sales)
Today the Excel file is parsed **entirely in the browser** (`xlsx` library reads the `File` as an `ArrayBuffer`; nothing is ever sent to a server). The user reviews a "Valid Records" / "Invalid Records" tab split, can edit-and-revalidate invalid rows inline, then clicks "Add Products" / "Add Records" — which today just pushes the valid rows into local React state and shows a toast. For this to persist anywhere, each module needs a bulk-create endpoint that accepts the array of already-client-validated rows:

| | |
|---|---|
| **Pattern** | `POST /api/{resource}/bulk` |
| **Request body** | `{ month, rows: [ <module's flat upload-row shape> ] }` |
| **Response fields** | `{ insertedCount, failedRows?: [ { rowNumber, errors: [string] } ] }` — the `failedRows` field is **Suggested**, in case your backend wants to re-validate server-side even though the current UI assumes client validation is sufficient before this call is made |

---

## 5. Master API Table

| Page | Feature | Method | Endpoint | Request Params | Filters | Response Fields | Pagination | Tag |
|---|---|---|---|---|---|---|---|---|
| Dashboard | Summary widgets | GET | `/api/dashboard/summary` | query: `month`, `dealerId?`, `employeeId?` | month, dealer, employee (team-sales dropdown) | see §6.1 | none | Suggested (consolidates 5 confirmed widgets) |
| Products | List | GET | `/api/products/categories` | query: `search`, `sortBy`, `sortOrder`, `page`, `pageSize` | search (category/sub-category/product) | see §6.2 | `page`, `pageSize` | Suggested (no GET-on-load exists today; data currently arrives only via bulk upload) |
| Products | Bulk add | POST | `/api/products/bulk` | body: rows[] | — | `{ insertedCount }` | — | Confirmed from UI |
| Products | Edit row | PUT | `/api/products/{productId}` | path: `productId` | — | updated product | — | Needs Backend Confirmation (pencil icon unwired) |
| Products | Delete row | DELETE | `/api/products/{productId}` | path: `productId` | — | `{ success }` | — | Needs Backend Confirmation (trash icon unwired) |
| Products | History/revert | GET | `/api/products/{productId}/history` | path: `productId` | — | audit entries | — | Needs Backend Confirmation (icon unwired, semantics unclear) |
| Products | Export | GET | `/api/products/export` | query: same as List | same as List | xlsx file | — | Suggested |
| Employee Sales Target | List | GET | `/api/employee-sales-targets` | query: `month`, `managerCode`, `search`, `page`, `pageSize` | month, manager, search | see §6.3 | `page`, `pageSize` | Suggested (in-memory only today) |
| Employee Sales Target | Bulk add | POST | `/api/employee-sales-targets/bulk` | body: rows[] | — | `{ insertedCount }` | — | Confirmed from UI |
| Employee Sales Target | Export | GET | `/api/employee-sales-targets/export` | query: same as List | same as List | xlsx file | — | Suggested |
| Actual Sales | List | GET | `/api/actual-sales` | query: `month`, `managerCode`, `search`, `page`, `pageSize` | month, manager, search | see §6.4 | `page`, `pageSize` | Suggested (in-memory only today) |
| Actual Sales | Employee detail | GET | `/api/actual-sales/employees/{employeeCode}/detail` | path: `employeeCode`; query: `month` | month | see §6.4.1 | none | Confirmed from UI ("Detailed Sales" drawer) |
| Actual Sales | Bulk add | POST | `/api/actual-sales/bulk` | body: rows[] | — | `{ insertedCount }` | — | Confirmed from UI |
| Actual Sales | Export | GET | `/api/actual-sales/export` | query: same as List | same as List | xlsx file | — | Suggested |
| Incentive | List | GET | `/api/incentives` | query: `month`, `managerCode`, `search`, `page`, `pageSize` | month, manager, search | see §6.5 | `page`, `pageSize` | Confirmed from UI — explicit `TODO` comment names this exact call |
| Incentive | Update adjustment | PATCH | `/api/incentives/{employeeCode}/adjustment` | path: `employeeCode`; body: `{ month, adjustment }` | — | updated employee incentive group | — | Confirmed from UI (inline pencil → save/cancel) |
| Incentive | Activity log | GET | `/api/incentives/{employeeCode}/activity-log` | path: `employeeCode`; query: `month` | month | see §6.5.1 | none | Confirmed from UI (history icon → drawer) |
| Incentive | Submit for payment | POST | `/api/incentives/submit-for-payment` | body: `{ month, managerCode? }` | — | `{ submittedCount }` | — | Confirmed from UI (bulk action button) |
| Incentive | Export | GET | `/api/incentives/export` | query: same as List | same as List | xlsx file | — | Suggested |
| Sales (approval) | List | GET | `/api/sales-approvals` | query: `status`, `month`, `managerCode`, `search`, `page`, `pageSize` | status (pending/approved/rejected), month, manager, search | see §6.6 | `page`, `pageSize` | Confirmed from mock+layout config (UI itself is still an empty stub) |
| Sales (approval) | Update adjustment | PATCH | `/api/sales-approvals/{employeeCode}/adjustment` | path: `employeeCode`; body: `{ month, adjustment }` | — | updated row | — | Suggested (column marked `IsEditable` in config, mirrors Incentive) |
| Sales (approval) | Approve one | POST | `/api/sales-approvals/{employeeCode}/approve` | path: `employeeCode`; body: `{ month, remarks? }` | — | `{ status: "approved" }` | — | Needs Backend Confirmation (icon exists, `ApproveModal.tsx` is an empty stub) |
| Sales (approval) | Reject one | POST | `/api/sales-approvals/{employeeCode}/reject` | path: `employeeCode`; body: `{ month, reason? }` | — | `{ status: "rejected" }` | — | Needs Backend Confirmation (is a reason mandatory?) |
| Sales (approval) | Bulk approve | POST | `/api/sales-approvals/bulk-approve` | body: `{ month, employeeCodes: [] }` | — | `{ approvedCount }` | — | Needs Backend Confirmation (checkbox column + "Approve" button confirmed; exact contract not) |
| Sales (approval) | Bulk reject/remove | POST | `/api/sales-approvals/bulk-reject` | body: `{ month, employeeCodes: [] }` | — | `{ rejectedCount }` | — | Needs Backend Confirmation — the button is literally labeled **"Remove"**, not "Reject"; confirm with the client whether it rejects the record or deletes it from the pending queue entirely |
| Sales (approval) | Export | GET | `/api/sales-approvals/export` | query: same as List | same as List | xlsx file | — | Suggested |
| Shared | Managers master | GET | `/api/masters/managers` | `search?` | — | `{ managerCode, managerName }[]` | — | Confirmed (reused 4×) |
| Shared | Product category master | GET | `/api/masters/product-categories` | `search?` | — | see §4.3 | — | Confirmed (`productsConfig.json`) |
| Shared | Dealers master | GET | `/api/masters/dealers` | — | — | `{ dealerId, dealerName }[]` | — | Confirmed (dropdown exists, handler unwired) |
| Shared | Current user | GET | `/api/auth/me` | — | — | `{ userId, name, initials, role }` | — | Needs Backend Confirmation (no login UI exists) |

---

## 6. Detailed API specifications

### 6.1 Dashboard — `GET /api/dashboard/summary`

**Confirmed from UI:** every field below is read directly from `dashboardConfig.json` by five widget components (`SalesOverview`, `SalesSubmissions`, `SalesDealer`, `TeamSales`, `AchievedTeam`). The "May 2025" month-selector button and both widget dropdowns (dealer, and the unlabeled Team Sales dropdown) render but have **no wired `onChange`/`onClick`** in the current code — so the request parameters below are **Suggested**, while every response field is **Confirmed**.

Request:
```json
{
  "month": "2026-05",
  "dealerId": "",
  "employeeId": ""
}
```

Response:
```json
{
  "salesOverview": {
    "title": "Sales Overview",
    "yAxisLabels": [0, 25, 50, 75, 100, 125],
    "series": [
      { "categoryName": "Mixer Grinders", "target": 12, "achieved": 55, "actual": 85 }
    ]
  },
  "salesSubmissions": {
    "managersSubmitted": 38,
    "managersYetToSubmit": 32,
    "salesYetToReview": 123,
    "employeesGotIncentive": 132
  },
  "salesDealer": {
    "dealerOptions": ["Vasanth & Co - Chennai", "Vasanth & Co - Benglore"],
    "selectedDealer": "Vasanth & Co - Chennai",
    "series": [
      { "categoryName": "Mixer Grinders", "target": 60, "achieved": 48, "actual": 12 }
    ]
  },
  "topAchievedTeam": {
    "totalAchievement": 125383,
    "totalEmployees": 56,
    "employees": [
      { "employeeId": 1, "employeeName": "Pawan Kumar", "employeeCount": 12, "percentage": 21.93, "amount": 27500 }
    ]
  },
  "teamSales": {
    "employee": { "employeeId": 101, "employeeName": "Pawan Kumar" },
    "summary": { "target": 290, "achieved": 237, "actual": 202 },
    "products": [
      { "id": 1, "categoryName": "Mixer Grinders", "target": 45, "achieved": 38, "actual": 38, "achievementPercentage": 84.44 }
    ]
  }
}
```
*(`achievementPercentage` replaces the mock's pre-bucketed `"Performance": "86-90%"` string per the normalization in §3.)*

---

### 6.2 Products — `GET /api/products/categories`

**Confirmed fields** (from `productsConfig.json`, which already models this relationally):

Request:
```json
{
  "search": "",
  "sortBy": "targetQuantity",
  "sortOrder": "desc",
  "page": 1,
  "pageSize": 20
}
```
*(`sortBy` is only meaningful for `targetQuantity` and `eligibleIncentive` — those are the only two columns marked `sortable` in the current table config.)*

Response:
```json
{
  "data": [
    {
      "categoryId": 1,
      "categoryName": "Mixer Grinder",
      "code": "CAT_MIXER",
      "targetQuantity": 200,
      "eligibleIncentive": 500,
      "subCategories": [
        {
          "subCategoryId": 11,
          "subCategoryName": "Standard Mixer Grinder",
          "products": [
            {
              "productId": 301,
              "productName": "Panasonic MX-AC400-H 550W Mixer Grinder",
              "effectiveDate": "2026-01-01",
              "eligibleIncentive": 500
            }
          ]
        }
      ]
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "totalItems": 2, "totalPages": 1 }
}
```

Row actions (Delete / History / Edit icons render on every row with **no click handler wired** — see master table rows for the three corresponding endpoints, all **Needs Backend Confirmation**).

---

### 6.3 Employee Sales Target — `GET /api/employee-sales-targets`

Request:
```json
{ "month": "2026-05", "managerCode": "PS0987", "search": "", "page": 1, "pageSize": 10 }
```

Response:
```json
{
  "data": [
    {
      "employeeCode": "PS0019",
      "employeeName": "Aarav Sharma",
      "company": "Vasanth & Co",
      "location": "Chennai",
      "managerCode": "PS0987",
      "managerName": "Pawan Kumar",
      "month": "2026-05",
      "categories": [
        { "categoryName": "Mixer Grinders", "salesTarget": 45 },
        { "categoryName": "Microwave Ovens", "salesTarget": 25 }
      ]
    }
  ],
  "pagination": { "page": 1, "pageSize": 10, "totalItems": 1, "totalPages": 1 }
}
```

**Note:** this page has no row-level action icons at all (read-only list; data entry happens exclusively through bulk upload) — confirmed by the absence of an `action` column in `EMPLOYEE_TARGET_TABLE_COLUMNS`.

Bulk-upload row shape (`POST /api/employee-sales-targets/bulk`):
```json
{
  "employeeCode": "PS0019",
  "employeeName": "Aarav Sharma",
  "company": "Vasanth & Co",
  "location": "Chennai",
  "managerCode": "PS0987",
  "managerName": "Pawan Kumar",
  "month": "2026-05",
  "categoryName": "Mixer Grinders",
  "salesTarget": 45
}
```

---

### 6.4 Actual Sales — `GET /api/actual-sales`

Request:
```json
{ "month": "2026-05", "managerCode": "PS0987", "search": "", "page": 1, "pageSize": 10 }
```

Response:
```json
{
  "data": [
    {
      "employeeCode": "PS0019",
      "employeeName": "Aarav Sharma",
      "managerCode": "PS0987",
      "managerName": "Pawan Kumar",
      "categories": [
        { "categoryName": "Mixer Grinders", "actualSales": 35 }
      ]
    }
  ],
  "pagination": { "page": 1, "pageSize": 10, "totalItems": 1, "totalPages": 1 }
}
```

#### 6.4.1 Detail drawer — `GET /api/actual-sales/employees/{employeeCode}/detail?month=2026-05`

**Confirmed from UI** — the "Detailed Sales" button on every row opens a modal with exactly this shape:

```json
{
  "employeeCode": "PS0019",
  "employeeName": "Aarav Sharma",
  "role": "",
  "company": "Vasanth & Co",
  "location": "Chennai",
  "managerName": "Pawan Kumar",
  "month": "2026-05",
  "categories": [
    {
      "categoryName": "Mixer Grinders",
      "totalSales": 35,
      "products": [
        { "productCode": "MG001", "productName": "Panasonic Mixer Grinder 3 Stainless Steel Jars", "actualSales": 12 },
        { "productCode": "MG002", "productName": "Panasonic Monster Mixer Grinder 750 Watts", "actualSales": 23 }
      ]
    }
  ]
}
```
**Inconsistency to resolve (flagged, not decided for you):** the bulk-upload template's `Products` column is a single free-text string (e.g. `"Panasonic Mixer Grinder 3 Stainless Steel Jars"`), while the detail view's mock data (`actualSalesConfig.json`) models products as a structured array with codes and per-product sales. Recommend the bulk-upload template also capture a product code/ID so the two representations reconcile — currently they don't.

---

### 6.5 Incentive — `GET /api/incentives`

**Confirmed from UI**, including via an explicit `// TODO: replace with real API call, e.g. fetchIncentiveData(appliedMonth, appliedManager).then(setRows);` in `IncentiveList.tsx`.

Request:
```json
{ "month": "2026-05", "managerCode": "PS0987", "search": "", "page": 1, "pageSize": 10 }
```

Response — every employee always carries exactly these 5 fixed categories (`Mixer Grinders`, `Microwave Ovens`, `Rice Cookers`, `Induction Cooktops`, `Refrigerators`) in that order:
```json
{
  "data": [
    {
      "employeeCode": "PS0019",
      "employeeName": "Aarav Sharma",
      "managerCode": "PS0987",
      "managerName": "Pawan Kumar",
      "dealerName": "Vasanth & Co - Chennai",
      "submittedDate": "2026-05-02",
      "categories": [
        { "categoryName": "Mixer Grinders", "actual": 38, "regularized": 38, "target": 45, "incentive": 600 }
      ],
      "actualIncentiveAmount": 3100,
      "adjustmentAmount": -200,
      "finalIncentiveAmount": 2900
    }
  ],
  "pagination": { "page": 1, "pageSize": 10, "totalItems": 1, "totalPages": 1 }
}
```

#### 6.5.1 Activity log — `GET /api/incentives/{employeeCode}/activity-log?month=2026-05`

**Confirmed from UI** — matches the `ActivityLogEntry` type exactly:
```json
{
  "data": [
    {
      "date": "2026-05-22",
      "time": "13:15",
      "subject": "Sales",
      "verb": "approved",
      "verbColor": "success",
      "suffix": "and incentive adjusted by HR Manager",
      "existingIncentive": 3100,
      "adjustment": 300,
      "finalIncentive": 3400,
      "remarks": "Incentive amount revised based on attachments"
    }
  ]
}
```

#### 6.5.2 Update adjustment — `PATCH /api/incentives/{employeeCode}/adjustment`

Request:
```json
{ "month": "2026-05", "adjustment": -200 }
```
Response: the updated employee incentive group (same shape as one item in §6.5's `data[]`).

#### 6.5.3 Submit for payment — `POST /api/incentives/submit-for-payment`

Request:
```json
{ "month": "2026-05", "managerCode": "" }
```
Response: `{ "submittedCount": 42 }`

---

### 6.6 Sales (approval) — `GET /api/sales-approvals`

**Important design note:** the current mock data models Pending/Approved/Rejected as **three separate arrays** (`PendingData`, `ApprovedData`, `RejectedData` in `salesConfig.json`), each with its own near-identical column-header block. This document recommends **one endpoint with a `status` filter** instead of three endpoints — this is a **Suggested** normalization, not a literal reproduction of the mock's shape, because: (a) it's the standard REST pattern for exactly this "one entity, three states" situation, and (b) the Approved/Rejected mock records already carry a `Status` field that Pending's does not, meaning the underlying record clearly gets a status field once it leaves Pending — it isn't really three different resources.

Request:
```json
{
  "status": "pending",
  "month": "2026-05",
  "managerCode": "all",
  "search": "",
  "page": 1,
  "pageSize": 10
}
```

Response:
```json
{
  "data": [
    {
      "employeeCode": "PS0019",
      "employeeName": "Aarav Sharma",
      "dealerName": "Vasanth & Co - Chennai",
      "managerCode": "PS0987",
      "managerName": "Pawan Kumar",
      "submittedDate": "2026-05-02",
      "categories": [
        {
          "categoryId": 101,
          "categoryName": "Mixer Grinders",
          "actualSales": 38,
          "regularizedSales": 38,
          "salesTarget": 45,
          "incentiveAmount": 600,
          "achievementPercentage": 84.44
        }
      ],
      "actualIncentiveAmount": 3100,
      "adjustmentAmount": 0,
      "finalIncentiveAmount": 3100,
      "status": "pending",
      "rejectedDate": null
    }
  ],
  "counts": { "pending": 95, "approved": 0, "rejected": 0 },
  "pagination": { "page": 1, "pageSize": 10, "totalItems": 95, "totalPages": 10 }
}
```
*(`counts` is **Suggested** — the UI's tab labels show `Pending(95) / Approved(0) / Rejected(0)`, which needs the totals for all three statuses regardless of which tab is active, so the list endpoint should return them alongside whichever page of rows was requested.)*

**Needs Backend Confirmation — approve/reject contract.** The reference screenshot shows per-row ✓/× icons plus row-selection checkboxes and top-level "Remove"/"Approve" buttons (from `pageLayout.json`'s `Sales.CustomButtons`), but `ApproveModal.tsx` — the component that presumably opens on one of these actions — is a completely empty stub. Before building, confirm with the client:
1. Does approve/reject happen instantly on icon click, or does it open `ApproveModal` for a confirmation/remarks step first?
2. Is a rejection reason mandatory (the Incentive Activity Log's `remarks` field suggests the app's convention is to always capture a reason for incentive-affecting actions)?
3. Does the top-level "Remove" button reject the selected rows, or delete them from the queue outright? The label is literally "Remove," not "Reject."

---

## 7. Data flow between pages

**List → Detail:** Actual Sales List → "Detailed Sales" button → `GET /api/actual-sales/employees/{employeeCode}/detail?month=` → renders in `ActualSalesDetailModal`. No separate route change — it's a modal, so this is a client-side fetch-on-click, not a navigation.

**List → Edit (inline) → Update:** Incentive List → pencil icon on a row → input becomes editable → check-mark icon → `PATCH /api/incentives/{employeeCode}/adjustment` → row re-renders with the server's returned totals. The Sales approval list is expected to follow the identical pattern for its own editable `AdjustmentAmount` column (config already marks it `IsEditable: true`).

**List → History drawer:** Incentive List → history icon → `GET /api/incentives/{employeeCode}/activity-log` → renders in the `ActivityLog` drawer (built on the shared `CustomModal`). Products List has an equivalent history icon with no drawer built yet — **Needs Backend Confirmation** whether it should reuse this same drawer pattern.

**Upload → Review → Commit:** Any bulk-upload page → user selects/drops an Excel file → parsed **entirely client-side** → user reviews Valid/Invalid tabs, can edit-and-revalidate invalid rows in place → "Add" button → `POST /api/{resource}/bulk` with only the validated rows → navigate back to the list page, which should then re-fetch (`GET /api/{resource}`) rather than trust the client's just-submitted rows as the new source of truth.

**Filter → Get Results → List refresh:** every filterable list (Employee Sales Target, Actual Sales, Incentive, Sales) shares the identical Month + Manager filter card. "Get Results" applies both as query params to that page's GET list call; "Clear" resets both to empty and (per current client behavior) also clears the applied filters immediately, i.e. it likely triggers its own re-fetch with empty params rather than just resetting the form fields.

---

## 8. Common response envelope

Every paginated list endpoint in this spec should use the same envelope so the frontend's table component can be written once and reused (mirroring how `GroupedIncentiveTable`/`TablePagination` is already shared across five pages):

```json
{
  "data": [ "...rows..." ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 48,
    "totalPages": 5
  }
}
```
This matches the pagination footer already built and shared across the app, which literally renders `"{rangeStart} - {rangeEnd} of {total}"` — i.e. `totalItems` is the only number it strictly needs, with `rangeStart`/`rangeEnd` computed client-side from `page` and `pageSize`.

Error envelope (**Suggested** — no error UI beyond generic toasts exists today, so exact shape is not confirmed):
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

---

## 9. Summary of items needing your decision before backend work starts

1. **Authentication** — no login screen exists in the UI at all. Confirm whether it's out of scope for now or pending a separate spec before building `/api/auth/me`.
2. **Sales approval reject/approve modal** — `ApproveModal.tsx` is empty; confirm the interaction and whether a reason/remarks is mandatory.
3. **Sales "Remove" button semantics** — reject vs. hard delete from the pending queue.
4. **Products row actions** (Edit/Delete/History icons) — all three render with zero wired behavior; confirm intended endpoints and whether History reuses the Incentive Activity Log pattern.
5. **Category as a relational FK vs. free text** — recommend using the existing `productsConfig.json` hierarchy as the single source of truth for category names across all four transactional modules instead of each one re-typing category strings independently.
6. **Bulk-upload server-side re-validation** — current UI assumes all validation happens client-side before the "Add" call; confirm whether the backend should also validate, and what a partial-failure response should look like.
