# Specification

## Summary
**Goal:** Add a complete repair order management system with its own navigation menu, CRUD operations, and dashboard statistics.

**Planned changes:**
- Add "Repair" section to main navigation menu
- Create RepairOrder data type in backend with fields for date, material (gold/silver/other), added material weight, material cost, making charge, total cost, delivery date, assign to, status (on process/complete), and delivery status (pending/delivered)
- Implement backend CRUD functions: createRepairOrder, updateRepairOrder, getRepairOrder, getRecentRepairOrders, and getRepairOrderStats with authorization checks
- Create RepairWizard component with multi-step form for all repair order fields, including auto-calculated total cost
- Create RepairOrdersView component displaying table of all repair orders with edit and view actions
- Add React Query hooks for repair orders: usePlaceRepairOrder, useUpdateRepairOrder, useGetRepairOrder, and useRecentRepairOrders
- Add repair orders statistics card to dashboard showing total count, breakdown by material type, and status breakdown

**User-visible outcome:** Users can navigate to a dedicated Repair section to create and manage repair orders separately from regular orders, view repair statistics on the dashboard, and track repair status and delivery.
