# 🐛 row.map() Error - Quick Fix

## ❌ Error
```
TypeError: row.map is not a function
```

## 🔍 Cause
Backend returns rows as **objects**: `{id: 1, name: "John"}`  
Frontend expects rows as **arrays**: `[1, "John"]`

## ✅ Fix
Convert objects to arrays before rendering:

```javascript
const rowsAsArrays = data.rows.map((row) => 
  columns.map((col) => row[col])
);
```

## 📁 Files Fixed
- ✅ `src/pages/SqlEditor.tsx`
- ✅ `src/pages/ApiBuilder.tsx`

## 🧪 Test
1. Go to SQL Editor
2. Execute: `SELECT * FROM your_table LIMIT 10`
3. ✅ Results display correctly
4. ✅ No console errors

## 📚 Full Guide
See `ROW_MAP_ERROR_FIX.md` for complete documentation.

---

**Status:** ✅ Fixed  
**Build:** ✅ Successful
