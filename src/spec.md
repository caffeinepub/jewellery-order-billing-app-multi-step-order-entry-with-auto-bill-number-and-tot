# Specification

## Summary
**Goal:** Make Order Wizard fields non-editable when Material is set to “Other”, and remove the footer attribution text without breaking layout.

**Planned changes:**
- In OrderWizard Step 2 (Weight), when Material = “Other”, disable Exchange Wt, Deduct Wt, and Added Wt inputs with disabled styling, and keep Total Wt consistent with the disabled inputs.
- In OrderWizard Step 3 (Amount), when Material = “Other”, disable Rate/gram and Material Cost inputs with disabled styling, and set/keep their values at 0 for consistent calculations.
- Re-enable the above inputs when Material changes away from “Other”, respecting existing rules/auto-calculations.
- Remove the “© {year} · Built with using caffeine.ai” footer attribution (including icon/link) while keeping the footer layout intact.

**User-visible outcome:** Selecting Material = “Other” disables weight and rate/material cost fields in the wizard (and keeps totals consistent), and the footer no longer shows the caffeine.ai attribution while still displaying properly.
