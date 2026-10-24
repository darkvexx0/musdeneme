
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const http = require("node:http");

// BOT TOKENINI BURAYA YAZ
const TOKEN = "MTU2MzQ4ODU5NTI3NTQxNTU4Mg.GQRQVP.9jCpY9c1QxLDuMQvPXHIMzZbFakA93qzo78I3E";

const PREFIX = "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Render icin HTTP sunucusu
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  res.end("Moderasyon botu aktif!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP sunucusu ${PORT} portunda acildi.`);
});

client.once("ready", () => {
  console.log(`BOT AKTIF: ${client.user.tag}`);
  client.user.setActivity("!yardim | Moderasyon");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  try {
    if (command === "ping") {
      return message.reply(`Pong! ${client.ws.ping}ms`);
    }

    if (["yardim", "yardım"].includes(command)) {
      const embed = new EmbedBuilder()
        .setColor(0xC0392B)
        .setTitle("Moderasyon Botu")
        .setDescription([
          "`!ping` - Bot gecikmesi",
          "`!at @uye [sebep]` - Sunucudan at",
          "`!yasakla @uye [sebep]` - Yasakla",
          "`!yasakkaldir ID` - Yasağı kaldır",
          "`!temizle 10` - Mesajları temizle",
          "`!sustur @uye 10m [sebep]` - Sustur",
          "`!susturmakaldir @uye` - Susturmayı kaldır"
        ].join("\n"));

      return message.reply({ embeds: [embed] });
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers) &&
        !message.member.permissions.has(PermissionFlagsBits.KickMembers) &&
        !message.member.permissions.has(PermissionFlagsBits.BanMembers) &&
        !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply("Bu komutları kullanmak için moderasyon yetkin olmalı.");
    }

    if (command === "at") {
      if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return message.reply("Üyeleri atma yetkin yok.");
      }

      const member = message.mentions.members.first();
      if (!member) return message.reply("Kullanım: `!at @uye [sebep]`");
      if (!member.kickable) return message.reply("Bu üyeyi atamıyorum.");

      const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";
      await member.kick(reason);
      return message.reply(`${member.user.tag} sunucudan atıldı. Sebep: ${reason}`);
    }

    if (command === "yasakla") {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply("Üyeleri yasaklama yetkin yok.");
      }

      const member = message.mentions.members.first();
      if (!member) return message.reply("Kullanım: `!yasakla @uye [sebep]`");
      if (!member.bannable) return message.reply("Bu üyeyi yasaklayamıyorum.");

      const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";
      await member.ban({ reason });
      return message.reply(`${member.user.tag} yasaklandı. Sebep: ${reason}`);
    }

    if (["yasakkaldir", "yasakkaldır"].includes(command)) {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply("Yasak kaldırma yetkin yok.");
      }

      const userId = args[0];
      if (!userId) return message.reply("Kullanım: `!yasakkaldir KULLANICI_ID`");

      await message.guild.members.unban(userId);
      return message.reply(`${userId} kullanıcısının yasağı kaldırıldı.`);
    }

    if (command === "temizle") {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply("Mesajları yönetme yetkin yok.");
      }

      const amount = Number(args[0]);
      if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
        return message.reply("Kullanım: `!temizle 1-100`");
      }

      const deleted = await message.channel.bulkDelete(amount, true);
      const notice = await message.channel.send(`${deleted.size} mesaj silindi.`);
      setTimeout(() => notice.delete().catch(() => {}), 4000);
      return;
    }

    if (command === "sustur") {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply("Üyeleri susturma yetkin yok.");
      }

      const member = message.mentions.members.first();
      const durationArg = args[1];

      if (!member || !durationArg) {
        return message.reply("Kullanım: `!sustur @uye 10m [sebep]`");
      }

      const match = durationArg.match(/^(\d+)(s|m|h|d)$/i);
      if (!match) {
        return message.reply("Süre biçimi: `30s`, `10m`, `2h` veya `1d`");
      }

      const amount = Number(match[1]);
      const unit = match[2].toLowerCase();
      const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
      const duration = amount * multipliers[unit];

      if (duration < 1000 || duration > 28 * 86400000) {
        return message.reply("Süre 1 saniye ile 28 gün arasında olmalı.");
      }

      if (!member.moderatable) {
        return message.reply("Bu üyeyi susturamıyorum.");
      }

      const reason = args.slice(2).join(" ") || "Sebep belirtilmedi";
      await member.timeout(duration, reason);
      return message.reply(`${member.user.tag} susturuldu. Süre: ${durationArg}. Sebep: ${reason}`);
    }

    if (["susturmakaldir", "susturmakaldır"].includes(command)) {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply("Susturmayı kaldırma yetkin yok.");
      }

      const member = message.mentions.members.first();
      if (!member) return message.reply("Kullanım: `!susturmakaldir @uye`");
      if (!member.moderatable) return message.reply("Bu üyenin susturmasını kaldıramıyorum.");

      await member.timeout(null);
      return message.reply(`${member.user.tag} üzerindeki susturma kaldırıldı.`);
    }
  } catch (error) {
    console.error("Komut hatası:", error);
    return message.reply("Komut çalıştırılırken hata oluştu. Botun yetkilerini ve rol sırasını kontrol et.")
      .catch(() => {});
  }
});

client.login(TOKEN).catch((error) => {
  console.error("Discord giris hatasi:", error);
});
