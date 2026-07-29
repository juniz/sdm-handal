# Shared UI Components

Framework primitives are local shadcn-style React components backed by Radix UI and Tailwind CSS.

## Button

- Path: `src/components/ui/button.jsx`
- Export: `Button`
- Purpose: shared button with variant and size support through CVA.
- Key props: `variant`, `size`, `asChild`, native button props.
- Full source: use `src/components/ui/button.jsx`.

## Card

- Path: `src/components/ui/card.jsx`
- Exports: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`.
- Purpose: shared bordered surface primitives.
- Full source: use `src/components/ui/card.jsx`.

## Tabs

- Path: `src/components/ui/tabs.jsx`
- Exports: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
- Purpose: Radix tabs with shared active and focus states.
- Full source: use `src/components/ui/tabs.jsx`.

## Select

- Path: `src/components/ui/select.jsx`
- Exports: `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectTrigger`, `SelectValue` and supporting primitives.
- Purpose: Radix select with portal-based dropdown content.
- Full source: use `src/components/ui/select.jsx`.

## Textarea

- Path: `src/components/ui/textarea.jsx`
- Export: `Textarea`.
- Purpose: styled native textarea.
- Full source: use `src/components/ui/textarea.jsx`.

## Badge

- Path: `src/components/ui/badge.jsx`
- Export: `Badge`.
- Purpose: compact semantic labels.
- Full source: use `src/components/ui/badge.jsx`.

## Accordion

- Path: `src/components/ui/accordion.jsx`
- Exports: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
- Purpose: Radix disclosure sections.
- Full source: use `src/components/ui/accordion.jsx`.

## Alert Dialog

- Path: `src/components/ui/alert-dialog.jsx`
- Exports: full Radix alert-dialog composition.
- Purpose: destructive-action confirmation.
- Full source: use `src/components/ui/alert-dialog.jsx`.

## Table

- Path: `src/components/ui/table.jsx`
- Exports: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` and supporting primitives.
- Purpose: desktop tabular data.
- Full source: use `src/components/ui/table.jsx`.

## DatePicker

- Path: `src/components/DatePicker.jsx`
- Export: default `DatePicker`.
- Purpose: localized date selection using Popover and Calendar.
- Key props: `value`, `onChange`, `placeholder`, `error`, `minDate`.
- Full source: use `src/components/DatePicker.jsx`.

## PegawaiCombobox

- Path: `src/components/PegawaiCombobox.jsx`
- Export: named and default `PegawaiCombobox`.
- Purpose: searchable employee selection.
- Key props: `value`, `onValueChange`, `error`.
- Full source: use `src/components/PegawaiCombobox.jsx`.
