const pool = require('./pool');
const logger = require('../logger');

const migrations = [
  {
    name: '001_create_notifications',
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID,
        user_email   VARCHAR(255),
        channel      VARCHAR(32) NOT NULL DEFAULT 'email',
        subject      VARCHAR(255),
        body         TEXT,
        event_type   VARCHAR(64),
        event_id     UUID,
        status       VARCHAR(32) NOT NULL DEFAULT 'queued',
        error        TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        sent_at      TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_event ON notifications(event_id);`,
  },
];

async function runMigrations() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  for (const m of migrations) {
    const { rows } = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [m.name]);
    if (rows.length === 0) {
      logger.info({ migration: m.name }, 'applying');
      await pool.query(m.sql);
      await pool.query('INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [m.name]);
    }
  }
}
if (require.main === module) runMigrations().then(() => process.exit(0)).catch((err) => { logger.error({ err }); process.exit(1); });
module.exports = { runMigrations };
