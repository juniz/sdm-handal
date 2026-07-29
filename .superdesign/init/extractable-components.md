# Extractable Components

## BottomNavigation

- Source: `src/components/BottomNavigation.js`
- Category: layout
- Description: fixed mobile dashboard navigation.
- Extractable props: current route/active item.
- Hardcoded: menu labels, icon names, layout classes.

## DashboardSidebar

- Source: `src/app/dashboard/layout.js`
- Category: layout
- Description: responsive dashboard navigation and brand shell.
- Extractable props: active route, open state, menu groups.
- Hardcoded: brand text, visual structure, icons.

## Tabs

- Source: `src/components/ui/tabs.jsx`
- Category: basic
- Description: shared Radix tab primitives.
- Extractable props: active tab.
- Hardcoded: focus and active-state classes.

## Button

- Source: `src/components/ui/button.jsx`
- Category: basic
- Description: shared CVA button.
- Extractable props: variant, size, disabled state.
- Hardcoded: variant class definitions.

## DatePicker

- Source: `src/components/DatePicker.jsx`
- Category: basic
- Description: localized date selection control.
- Extractable props: value, placeholder, error, minimum date.
- Hardcoded: calendar icon and visual classes.

## PegawaiCombobox

- Source: `src/components/PegawaiCombobox.jsx`
- Category: basic
- Description: searchable employee selector.
- Extractable props: value, error, open state.
- Hardcoded: search and check icons.

For this single-route redesign, skip DraftComponent extraction: the shared dashboard layout is not being redesigned and basic primitives are better represented inline in the draft.
