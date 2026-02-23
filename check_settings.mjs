
import { rawQuery } from "./src/lib/db-helper.js";

async function check() {
    try {
        const settings = await rawQuery("SELECT * FROM penggajian_settings ORDER BY id DESC LIMIT 1");
        console.log("SETTINGS:", JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error("ERROR:", e);
    }
}

check();
