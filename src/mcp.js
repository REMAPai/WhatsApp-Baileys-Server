const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { z } = require('zod');
const db = require('./db');

function createMcpServer() {
  const server = new McpServer({
    name: 'personalos-signals',
    version: '1.0.0',
  });

  server.tool(
    'today_priorities',
    "Get today's ranked list of WhatsApp conversations that need Andrew's attention, with a score and one-line reason for each.",
    {},
    async () => {
      const priorities = await db.getTodayPriorities();
      const date = new Date().toISOString().slice(0, 10);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ date, priorities }, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'thread_summary',
    'Get the recent message history for one specific WhatsApp conversation, given its remote_jid (found in the today_priorities results).',
    {
      remoteJid: z
        .string()
        .describe('The WhatsApp conversation ID, e.g. "107443019354332@lid" or "120363403784538015@g.us".'),
    },
    async ({ remoteJid }) => {
      const messages = await db.getThreadSummary(remoteJid);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ remoteJid, messages }, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'search_signals',
    "Search across all of Andrew's WhatsApp messages for a keyword or phrase.",
    {
      query: z.string().describe('The keyword or phrase to search for.'),
    },
    async ({ query }) => {
      const results = await db.searchSignals(query);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ query, results }, null, 2),
          },
        ],
      };
    },
  );

  return server;
}

module.exports = { createMcpServer };
