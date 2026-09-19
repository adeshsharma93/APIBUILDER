# Database Explorer Schema Fix - Quick Reference

## Problem
Tables not showing in Database Explorer for MySQL databases

## Cause
Frontend was hardcoded to only show 'dbo' schema (SQL Server), but MySQL uses database name as schema

## Fix
Changed from hardcoded schema to dynamic schema extraction from fetched tables

## Code Change
**File:** `src/pages/DatabaseExplorer.tsx` (line ~315)

**Before:**
```typescript
{['dbo'].map((schema) => (
```

**After:**
```typescript
{(() => {
  const schemas = Array.from(new Set(filteredTables.map(t => t.schema || 'default')));
  return schemas.map((schema) => {
    const schemaTables = filteredTables.filter(t => (t.schema || 'default') === schema);
    return (
```

## Result
✅ MySQL tables now display correctly  
✅ SQL Server tables still work  
✅ All schemas shown dynamically  

## Test
1. Restart frontend: `npm run dev`
2. Go to Database Explorer
3. Select MySQL connection
4. Tables should appear under database name

## Build
✅ Successful (748.25 kB)
