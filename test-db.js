const { rawQuery } = require('./src/lib/db-helper');

async function test() {
  try {
    const data = await rawQuery('SELECT * FROM pencapaian_kinerja');
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
test();
