
require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const http = require("node:http");

const TOKEN = process.env.DISCORD_TOKEN;
const PORT = process.env.PORT || 3000;

console.log("[BASLANGIC] Bot baslatiliyor...");
console.log("[TOKEN] Token mevcut:", Boolean(TOKEN));

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hyper Uptime test sunucusu aktif!");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("[WEB] HTTP sunucusu acildi:", PORT);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on("debug", message => {
  if (message.includes("WebSocket")) {
    console.log("[DISCORD DEBUG]", message);
  }
});

client.on("ready", () => {
  console.log("[BASARILI] DISCORD BOTU CEVRIMICI:", client.user.tag);
  client.user.setActivity("Test ediliyor");
});

client.on("error", error => {
  console.error("[DISCORD CLIENT HATASI]", error);
});

client.on("shardError", error => {
  console.error("[DISCORD BAGLANTI HATASI]", error);
});

if (!TOKEN) {
  console.error("[HATA] Render Environment icinde DISCORD_TOKEN yok!");
} else {
  client.login(TOKEN).catch(error => {
    console.error("[GIRIS HATASI]", error);
  });
}
