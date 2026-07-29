# Page Dependency Trees

## `/dashboard/izin`

Entry: `src/app/dashboard/izin/page.js`

Dependencies:

- `src/app/dashboard/izin/components/PengajuanIzinForm.js`
  - `src/components/ui/button.jsx`
    - `src/lib/utils.js`
  - `src/components/DatePicker.jsx`
    - `src/components/ui/button.jsx`
    - `src/components/ui/calendar.jsx`
    - `src/components/ui/popover.jsx`
  - `src/components/ui/select.jsx`
    - `src/lib/utils.js`
  - `src/components/ui/textarea.jsx`
    - `src/lib/utils.js`
  - `src/components/PegawaiCombobox.jsx`
    - `src/components/ui/button.jsx`
    - `src/components/ui/command.jsx`
    - `src/components/ui/popover.jsx`
- `src/app/dashboard/izin/components/DaftarIzin.js`
  - `src/components/ui/table.jsx`
  - `src/components/ui/button.jsx`
  - `src/components/ui/badge.jsx`
  - `src/components/DatePicker.jsx`
  - `src/components/ui/alert-dialog.jsx`
  - `src/components/ui/accordion.jsx`
- `src/components/ui/card.jsx`
- `src/components/ui/tabs.jsx`
- `src/app/dashboard/layout.js`
  - `src/components/BottomNavigation.js`
  - `src/components/UserProfile.jsx`
  - `src/components/LogoutConfirmationModal.jsx`
  - `src/components/notifications/index.js`
- `src/app/layout.js`
  - `src/app/globals.css`
  - `src/components/PWAHandler.js`

Use the three route-local files, shared UI primitives, `.superdesign/init/theme.md`, and the dashboard layout render branch as design context. All target files are under 900 lines and should be passed whole.
