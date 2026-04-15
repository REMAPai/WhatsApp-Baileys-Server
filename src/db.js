const { Pool } = require('pg');
const config = require('./config');
const logger = require('./logger');

const pool = new Pool({
  connectionString: config.databaseUrl,
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id            TEXT PRIMARY KEY,
        remote_jid    TEXT NOT NULL,
        from_me       BOOLEAN NOT NULL DEFAULT false,
        timestamp     BIGINT,
        message_type  TEXT,
        text_content  TEXT,
        raw_message   JSONB,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    logger.info('Database initialized — messages table ready');
  } finally {
    client.release();
  }
}

async function insertMessage({ id, remoteJid, fromMe, timestamp, messageType, textContent, rawMessage }) {
  await pool.query(
    `INSERT INTO messages (id, remote_jid, from_me, timestamp, message_type, text_content, raw_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING`,
    [id, remoteJid, fromMe, timestamp, messageType, textContent, rawMessage]
  );
}

async function getMessages({ limit = 50, offset = 0 } = {}) {
  const result = await pool.query(
    `SELECT id, remote_jid, from_me, timestamp, message_type, text_content, created_at
     FROM messages
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

async function getMessageCount() {
  const result = await pool.query('SELECT COUNT(*)::int AS count FROM messages');
  return result.rows[0].count;
}

module.exports = { pool, initDatabase, insertMessage, getMessages, getMessageCount };
