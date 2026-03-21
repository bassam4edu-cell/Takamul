const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function test() {
  const userId = '1';
  try {
    const notifications = await sql`
      SELECT n.*, COALESCE(u.name, 'مستخدم محذوف') as sender_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = ${userId}
      ORDER BY n.created_at DESC
      LIMIT 20
    `;
    console.log(notifications);
  } catch (err) {
    console.error(err);
  }
}
test();
