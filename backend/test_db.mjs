import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;

async function test() {
  const dbUrl = 'postgresql://neondb_owner:npg_lbs2xDuHJ0in@ep-little-butterfly-amd28tbk.c-5.us-east-1.aws.neon.tech/neondb';
  const pool = new Pool({ 
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    const user = await prisma.user.findFirst();
    console.log("DB connection successful, user:", user);
  } catch (err) {
    console.error("DB connection error:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
test();
