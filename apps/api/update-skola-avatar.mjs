import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

try {
  await sql`UPDATE users SET avatar = 'https://app.skola.academy/logo.png' WHERE username = 'Skola'`;
  console.log('Skola avatar updated');
} catch (e) {
  console.log('Avatar update skipped:', e.message);
}

await sql.end();
