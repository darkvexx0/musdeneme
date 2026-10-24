
require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const http = require("node:http");

const TOKEN = process.env.DISCORD_TOKEN;
const PORT = process.env.PORT || 3000;

if (!TOKEN) {
  console.error("HATA: DISCORD_TOKEN ayarlanmamis!");
  process.exit(1);
}

// Render icin HTTP sunucusu
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Test Discord botu aktif!");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP sunucusu ${PORT} portunda calisiyor.`);
});

// Discord botu
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`${client.user.tag} Discord'a baglandi!`);
  client.user.setActivity("Hyper Uptime testinde");
});

console.log("Discord girisi baslatiliyor...");
console.log("Token mevcut mu:", Boolean(TOKEN));

client.on("error", error => {
  console.error("Discord istemci hatasi:", error);
});

client.login(TOKEN)
  .then(() => {
    console.log("Discord giris istegi basarili!");
  })
  .catch(error => {
    console.error("Discord giris hatasi:", error);
  });
