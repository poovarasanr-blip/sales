# Mock API Data — Sales Incentive App

One JSON file per module. Each top-level key inside a file is one screen/interaction; each has:

- `status` — `confirmed-from-ui` (literally in the code/mock today), `suggested` (a reasonable shape for a feature the UI shows but doesn't yet call anywhere), or `needs-backend-confirmation` (an icon/button exists with no wired behavior — contract unknown).
- `notes` — why it's tagged that way, and any inconsistency found in the current app worth resolving before backend work starts.
- `request` — the parameters the screen needs to send.
- `response` — the exact structure the screen needs back.

No HTTP methods or endpoint paths are included anywhere, per your instruction — these are pure data contracts for your backend team to implement against.

## Files
- `masters.mock.json` — shared dropdowns/reference data (managers, product category tree, dealers) reused across multiple screens, plus a current-user placeholder.
- `dashboard.mock.json` — the 5-widget dashboard summary.
- `products.mock.json` — Products list, bulk upload, and the (currently unwired) edit/delete/history row actions.
- `employeeSalesTargets.mock.json` — Employee Sales Target list + bulk upload.
- `actualSales.mock.json` — Actual Sales list, employee detail drawer, bulk upload.
- `incentives.mock.json` — Incentive list, inline adjustment edit, activity log drawer, submit-for-payment.
- `salesApprovals.mock.json` — Sales approval list (Pending/Approved/Rejected), adjustment edit, approve/reject/bulk actions.

## Known gaps to resolve with the client before backend work starts
See the `notes` field on: `salesApprovals.mock.json → approve/reject/bulkApprove/bulkRejectOrRemove` (the approval modal is an empty stub in the code), `products.mock.json → update/delete/history` (icons exist, no handlers wired), and `masters.mock.json → currentUser` (no login screen exists in this app at all).
