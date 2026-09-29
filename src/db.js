const { Pool } = require("pg");
const config = require("./config");
const logger = require("./logger");

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
        sender        TEXT,
        push_name     TEXT,
        from_me       BOOLEAN NOT NULL DEFAULT false,
        timestamp     BIGINT,
        message_type  TEXT,
        text_content  TEXT,
        raw_message   JSONB,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(
      `ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender TEXT`,
    );
    await client.query(
      `ALTER TABLE messages ADD COLUMN IF NOT EXISTS push_name TEXT`,
    );
    await client.query(
      `ALTER TABLE messages ADD COLUMN IF NOT EXISTS phone TEXT`,
    );
    await client.query(
      `ALTER TABLE messages ADD COLUMN IF NOT EXISTS chat_name TEXT`,
    );
    await client.query(
      `ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT false`,
    );
    logger.info("Database initialized — messages table ready");
  } finally {
    client.release();
  }
}

async function insertMessage({
  id,
  remoteJid,
  sender,
  phone,
  pushName,
  fromMe,
  timestamp,
  messageType,
  textContent,
  rawMessage,
  chatName,
  isGroup,
}) {
  await pool.query(
    `INSERT INTO messages (id, remote_jid, sender, phone, push_name, from_me, timestamp, message_type, text_content, raw_message, chat_name, is_group)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (id) DO NOTHING`,
    [
      id,
      remoteJid,
      sender,
      phone,
      pushName,
      fromMe,
      timestamp,
      messageType,
      textContent,
      rawMessage,
      chatName,
      isGroup,
    ],
  );
}

async function getMessages({ limit = 50, offset = 0 } = {}) {
  const result = await pool.query(
    `SELECT id, remote_jid, sender, phone, push_name, from_me, timestamp, message_type, text_content, chat_name, is_group, created_at
     FROM messages
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return result.rows;
}

async function getMessageCount() {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS count FROM messages",
  );
  return result.rows[0].count;
}

async function getTodayPriorities() {
  const result = await pool.query(
    `SELECT chat_name, remote_jid, final_score, reason, needs_response, message_count, last_message_at
     FROM priority_scores
     WHERE scored_date = CURRENT_DATE
       AND needs_response = true
     ORDER BY final_score DESC`,
  );
  return result.rows;
}

async function getThreadSummary(remoteJid) {
  const result = await pool.query(
    `SELECT push_name, from_me, text_content, created_at
     FROM messages
     WHERE remote_jid = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [remoteJid],
  );
  return result.rows.reverse(); // oldest first, readable order
}

async function searchSignals(query) {
  const result = await pool.query(
    `SELECT remote_jid, chat_name, push_name, from_me, text_content, created_at
     FROM messages
     WHERE text_content ILIKE $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [`%${query}%`],
  );
  return result.rows;
}

module.exports = {
  pool,
  initDatabase,
  insertMessage,
  getMessages,
  getMessageCount,
  getTodayPriorities,
  getThreadSummary,
  searchSignals,
};
