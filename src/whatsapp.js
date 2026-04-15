const {
  makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const QRCode = require("qrcode");
const qrcodeTerminal = require("qrcode-terminal");
const config = require("./config");
const logger = require("./logger");
const db = require("./db");

let sock = null;
let connectionStatus = "disconnected";
let currentQrBase64 = null;
let userInfo = null;
let manualDisconnect = false;

async function init() {
  manualDisconnect = false;
  const { version } = await fetchLatestBaileysVersion();
  logger.info({ version }, "Using WA version");

  const { state, saveCreds } = await useMultiFileAuthState(config.authFolder);

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        logger.child({ level: "silent" }),
      ),
    },
    logger: logger.child({ level: "silent" }),
    browser: Browsers.macOS("Chrome"),
    syncFullHistory: true,
    getMessage: async () => undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcodeTerminal.generate(qr, { small: true });
      currentQrBase64 = await QRCode.toDataURL(qr);
      logger.info("New QR code generated — scan with WhatsApp");
    }

    if (connection === "connecting") {
      connectionStatus = "connecting";
    }

    if (connection === "open") {
      connectionStatus = "connected";
      currentQrBase64 = null;
      userInfo = {
        id: sock.user?.id,
        name: sock.user?.name,
      };
      logger.info({ user: userInfo }, "WhatsApp connected");
    }

    if (connection === "close") {
      connectionStatus = "disconnected";
      userInfo = null;

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect =
        statusCode !== DisconnectReason.loggedOut && !manualDisconnect;

      logger.warn(
        { statusCode, shouldReconnect },
        "WhatsApp connection closed",
      );

      if (shouldReconnect) {
        logger.info("Reconnecting in 3 seconds...");
        setTimeout(() => init(), 3000);
      } else {
        logger.error(
          "Logged out. Delete the auth_info folder and restart to re-authenticate.",
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    const cutoff =
      Math.floor(Date.now() / 1000) - config.syncDays * 24 * 60 * 60;

    for (const msg of messages) {
      if (msg.key.remoteJid === "status@broadcast") continue;
      if (!msg.message) continue;

      const ts =
        typeof msg.messageTimestamp === "number"
          ? msg.messageTimestamp
          : Number(msg.messageTimestamp);

      if (ts && ts < cutoff) continue;

      const messageType = Object.keys(msg.message)[0];
      const textContent =
        msg.message.conversation || msg.message.extendedTextMessage?.text || "";

      const messageData = {
        id: msg.key.id,
        remoteJid: msg.key.remoteJid,
        fromMe: msg.key.fromMe || false,
        timestamp: ts,
        messageType,
        textContent,
        rawMessage: JSON.parse(JSON.stringify(msg.message)),
      };

      logger.info(
        {
          from: messageData.remoteJid,
          text: messageData.textContent,
          type: messageType,
        },
        "Message received",
      );

      try {
        await db.insertMessage(messageData);
      } catch (err) {
        logger.error({ err }, "Failed to save message to database");
      }
    }
  });
}

function getStatus() {
  return { status: connectionStatus, user: userInfo };
}

function getQrBase64() {
  return currentQrBase64;
}

async function sendMessage(phone, content) {
  if (!sock || connectionStatus !== "connected") {
    throw new Error("WhatsApp is not connected");
  }

  const jid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;
  const result = await sock.sendMessage(jid, content);
  logger.info({ jid }, "Message sent");
  return result;
}

async function logout() {
  if (!sock) {
    throw new Error("No active WhatsApp connection");
  }
  manualDisconnect = true;
  await sock.logout();
  sock = null;
  connectionStatus = "disconnected";
  currentQrBase64 = null;
  userInfo = null;
  logger.info("WhatsApp logged out by user");
}

function getSock() {
  return sock;
}

module.exports = { init, getStatus, getQrBase64, sendMessage, logout, getSock };
