# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are hospital employees completing day-to-day HR tasks, supervisors reviewing and approving performance work, and HRD/IT/admin staff operating organization-wide workforce data and workflows.

## Product Purpose

SDM Handal is the internal human-resources management platform for RS Bhayangkara Nganjuk. It supports employee self-service and administrative operations across attendance, shifts, leave, payroll, employee records, performance evaluation, IT assets, tickets, and related workforce workflows. Success means employees can complete routine HR work and authorized staff can review, approve, and administer it from one system.

## Positioning

SDM Handal brings employee self-service, attendance and scheduling, payroll, performance evaluation, and operational support into one role-aware workflow for the hospital instead of separating these activities across disconnected tools.

## Operating Context

The product is used as a browser-based internal application, with PWA support for mobile access. Employees submit and review their own requests and records; supervisors review team performance; HRD, IT, and administrators manage broader datasets, approvals, configuration, and operational queues.

## Capabilities and Constraints

- Role-based access is a core product constraint: employees, supervisors, HRD, IT, and administrators receive different views and permissions.
- Current workflows include attendance and location-aware check-in, shift and schedule management, leave and permission requests, payroll and salary reports, employee management, daily performance evaluation, tickets, IT assets, meetings, notifications, and operational dashboards.
- The product handles sensitive employee, attendance, location, performance, and payroll information; future work must preserve authenticated access and authorization boundaries.
- Indonesian-language terminology and hospital-specific organizational structures are part of the current product context.

## Brand Commitments

- Product name: SDM Handal.
- Organizational context: RS Bhayangkara Nganjuk.
- Existing identity guidance is documented in `docs/guides/DESIGN.md` and the incumbent implementation; future visual work should treat those as the current system unless a redesign is explicitly requested.

## Evidence on Hand

- Existing Next.js App Router implementation under `src/app` and reusable UI components under `src/components`.
- Existing design guidance at `docs/guides/DESIGN.md`.
- Feature and workflow documentation under `docs/features`, `docs/guides`, and `docs/superpowers/specs`.
- Existing API routes for attendance, payroll, leave, employee management, performance evaluation, tickets, IT assets, notifications, and dashboards under `src/app/api`.

## Product Principles

1. Make routine employee work self-service and easy to complete.
2. Make approvals, calculations, and administrative actions traceable.
3. Make role and data boundaries explicit and dependable.
4. Keep workforce information consolidated across connected HR workflows.

