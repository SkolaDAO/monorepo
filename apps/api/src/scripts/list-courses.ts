import "dotenv/config";
import { db } from "../db/index.js";
import { courses } from "../db/schema.js";

async function listCourses() {
  const all = await db.select().from(courses);
  console.log('Courses in database:', all.length);
  for (const c of all) {
    console.log('  -', c.title, `(${c.isFree ? 'FREE' : '$' + c.priceUsd})`);
  }
  process.exit(0);
}

listCourses().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
