#!/usr/bin/env node

/**
 * Script untuk debugging frontend cache dan storage
 * Jalankan dengan: node scripts/debug-frontend-cache.js
 */

console.log("🔍 === FRONTEND CACHE DEBUGGING GUIDE ===\n");

console.log("The problem might be in browser-side caching or storage.");
console.log("Since the database is clean but UI still shows data,");
console.log("we need to check browser-side storage and caching.\n");

console.log("📋 === STEP-BY-STEP DEBUGGING ===\n");

console.log("1️⃣ CLEAR ALL BROWSER DATA");
console.log("─".repeat(50));
console.log("Chrome/Edge:");
console.log("- Press F12 to open DevTools");
console.log("- Go to Application tab");
console.log('- Click "Storage" in left sidebar');
console.log('- Click "Clear site data" button');
console.log('- Check all boxes and click "Clear site data"');
console.log("");
console.log("Firefox:");
console.log("- Press F12 to open DevTools");
console.log("- Go to Storage tab");
console.log("- Right-click on your domain");
console.log('- Select "Delete All"');
console.log("");

console.log("2️⃣ CHECK SPECIFIC STORAGE LOCATIONS");
console.log("─".repeat(50));
console.log("In DevTools, check these locations for attendance data:");
console.log("");
console.log("📦 Local Storage:");
console.log("- Application tab → Local Storage → your domain");
console.log('- Look for keys containing "attendance", "presensi", or "today"');
console.log("");
console.log("📦 Session Storage:");
console.log("- Application tab → Session Storage → your domain");
console.log("- Look for attendance-related data");
console.log("");
console.log("📦 IndexedDB:");
console.log("- Application tab → IndexedDB → your domain");
console.log("- Check for any attendance databases");
console.log("");
console.log("📦 Service Workers:");
console.log("- Application tab → Service Workers");
console.log("- Check if any service workers are registered");
console.log('- Click "Unregister" if found');
console.log("");
console.log("📦 Cache Storage:");
console.log("- Application tab → Cache Storage");
console.log('- Look for "attendance-photos-v1" or similar');
console.log("- Delete all cache storage");
console.log("");

console.log("3️⃣ NETWORK DEBUGGING");
console.log("─".repeat(50));
console.log("- Go to Network tab in DevTools");
console.log('- Check "Disable cache" checkbox');
console.log("- Refresh the page");
console.log("- Look for these API calls:");
console.log("  • /api/attendance/today");
console.log("  • /api/attendance/completed");
console.log("  • /api/attendance/status");
console.log("- Check the response of each API call");
console.log("- Look for any cached responses (status 304)");
console.log("");

console.log("4️⃣ REACT DEVTOOLS DEBUGGING");
console.log("─".repeat(50));
console.log("If you have React DevTools installed:");
console.log("- Open React DevTools");
console.log("- Find the AttendancePage component");
console.log("- Check these state values:");
console.log("  • todayAttendance (should be null)");
console.log("  • completedAttendance (should be null)");
console.log("  • attendanceStatus (check the values)");
console.log("");

console.log("5️⃣ HARD REFRESH METHODS");
console.log("─".repeat(50));
console.log("Try these refresh methods in order:");
console.log("- Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)");
console.log("- Ctrl+Shift+R (Windows) or Cmd+Option+R (Mac)");
console.log("- Open in Incognito/Private mode");
console.log("- Different browser entirely");
console.log("");

console.log("6️⃣ SERVER-SIDE VERIFICATION");
console.log("─".repeat(50));
console.log("Verify server is serving correct data:");
console.log("- Open terminal");
console.log(
	'- Run: curl -X GET "http://127.0.0.1:3001/api/attendance/today" -H "Cookie: auth_token=YOUR_TOKEN"'
);
console.log("- Should return 401 (unauthorized) or null data");
console.log("- If it returns attendance data, the problem is server-side");
console.log("");

console.log("7️⃣ MANUAL STATE RESET");
console.log("─".repeat(50));
console.log("In browser console, try manually resetting state:");
console.log("- Open browser console (F12 → Console)");
console.log("- Type: localStorage.clear()");
console.log("- Type: sessionStorage.clear()");
console.log("- Type: location.reload(true)");
console.log("");

console.log("8️⃣ CHECK FOR STALE IMPORTS");
console.log("─".repeat(50));
console.log("The problem might be in stale JavaScript imports:");
console.log("- Stop the development server (Ctrl+C)");
console.log("- Delete .next folder: rm -rf .next");
console.log("- Delete node_modules/.cache: rm -rf node_modules/.cache");
console.log("- Restart: npm run dev");
console.log("- Test in incognito mode");
console.log("");

console.log("📊 === EXPECTED RESULTS AFTER CLEARING ===");
console.log("─".repeat(50));
console.log('✅ No "Data Presensi Hari Ini" section should appear');
console.log("✅ Should show form for new check-in");
console.log("✅ No jam masuk/pulang data displayed");
console.log('✅ Green "Siap untuk presensi masuk" status');
console.log("");

console.log("🆘 === IF PROBLEM PERSISTS ===");
console.log("─".repeat(50));
console.log("If data still appears after all steps above:");
console.log("1. The problem might be in a different user session");
console.log("2. Check if you're testing with the correct user ID");
console.log("3. There might be hardcoded test data in the component");
console.log("4. Check for any mock data or development overrides");
console.log("");

console.log("📝 === DEBUGGING CHECKLIST ===");
console.log("─".repeat(50));
console.log("□ Cleared all browser storage");
console.log("□ Disabled cache in Network tab");
console.log("□ Tested in incognito mode");
console.log("□ Verified API responses in Network tab");
console.log("□ Checked React component state");
console.log("□ Restarted development server");
console.log("□ Deleted .next folder and rebuilt");
console.log("□ Tested with different browser");
console.log("");

console.log("💡 === QUICK TEST ===");
console.log("─".repeat(50));
console.log("Fastest way to test:");
console.log("1. Open incognito/private window");
console.log("2. Go to your attendance page");
console.log("3. If data still appears → server-side issue");
console.log("4. If data gone → browser cache issue");

module.exports = {};
