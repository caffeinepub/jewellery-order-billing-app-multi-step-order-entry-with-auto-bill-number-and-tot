# Specification

## Summary
**Goal:** Debug and fix data fetching errors preventing historical orders, repair orders, and service records from loading in the application.

**Planned changes:**
- Fix getAllOrders query implementation to properly load historical orders in OrdersView
- Fix getAllRepairOrders query implementation to properly load historical repair orders in RepairOrdersView
- Fix getAllPiercingServices and getAllOtherServices query implementations to properly load historical service records
- Verify and correct backend query methods to return data in the correct format with all required fields
- Add comprehensive error logging and user-friendly error states for failed data loading

**User-visible outcome:** All historical orders, repair orders, and service records load successfully in their respective tables without errors, displaying complete data for all fields.
