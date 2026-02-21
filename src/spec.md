# Specification

## Summary
**Goal:** Restore all functionality that was working in version 13 while preserving the version 14 feature that disables material weight and cost fields when 'Other' material is selected.

**Planned changes:**
- Restore backend functions for order placement, updates, and retrieval across all order types (orders, repair orders, piercing services, other services)
- Fix frontend components to ensure dashboard statistics and recent records display correctly for all service types
- Verify all wizard forms (OrderWizard, RepairWizard, PiercingWizard, OtherWizard) complete their workflows without errors
- Preserve the version 14 behavior where 'Added Material Weight' and 'Material Cost' fields are disabled when 'Other' material is selected in the repair order form

**User-visible outcome:** All features and workflows from version 13 work correctly again, including creating/updating orders, viewing dashboard data, and completing wizard forms, while maintaining the improved material field behavior from version 14.
