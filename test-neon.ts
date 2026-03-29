import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const result = await (sql as any).query('SELECT DISTINCT grade, section FROM students WHERE school_id = 1 AND grade IS NOT NULL AND section IS NOT NULL ORDER BY grade, section');
    console.log("filters:", result);
  } catch (e: any) {
    console.log("error:", e.message);
  }
}
test();
