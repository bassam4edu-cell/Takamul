import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function seed() {
  const users = [
    {
      name: 'معلم تجربة',
      email: 'teacher@test.com',
      password: '123',
      role: 'teacher',
      is_active: true,
      is_phone_verified: true,
      status: 'ACTIVE',
      national_id: '1000000001'
    },
    {
      name: 'وكيل تجربة',
      email: 'vp@test.com',
      password: '123',
      role: 'vice_principal',
      is_active: true,
      is_phone_verified: true,
      status: 'ACTIVE',
      national_id: '1000000002'
    },
    {
      name: 'موجه تجربة',
      email: 'counselor@test.com',
      password: '123',
      role: 'counselor',
      is_active: true,
      is_phone_verified: true,
      status: 'ACTIVE',
      national_id: '1000000003'
    },
    {
      name: 'مدير تجربة',
      email: 'principal@test.com',
      password: '123',
      role: 'principal',
      is_active: true,
      is_phone_verified: true,
      status: 'ACTIVE',
      national_id: '1000000004'
    }
  ];

  for (const user of users) {
    // Check if exists
    const existing = await sql`SELECT id FROM users WHERE email = ${user.email}`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO users (name, email, password, role, is_active, is_phone_verified, status, national_id)
        VALUES (${user.name}, ${user.email}, ${user.password}, ${user.role}, ${user.is_active}, ${user.is_phone_verified}, ${user.status}, ${user.national_id})
      `;
      console.log(`Created user: ${user.email}`);
    } else {
      await sql`
        UPDATE users 
        SET password = ${user.password}, role = ${user.role}, is_active = ${user.is_active}, is_phone_verified = ${user.is_phone_verified}, status = ${user.status}
        WHERE email = ${user.email}
      `;
      console.log(`Updated user: ${user.email}`);
    }
  }
  console.log('Done seeding test users.');
}

seed().catch(console.error);
