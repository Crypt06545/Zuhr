// src/expenses/expenses.constants.ts

// Bumped on every expense change. The Finance report cache includes it,
// so a changed expense makes the old cached report unreachable.
export const EXPENSES_VERSION_KEY = 'expenses:version';

// Bangladesh calendar day, e.g. 2026-10-31
export const BD_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const MAX_EXPENSE_AMOUNT = 100_000_000;
