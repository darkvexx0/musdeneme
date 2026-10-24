
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

// TOKENINI BURAYA YAZ
const TOKEN = "MTU2MzQ4ODU5NTI3NTQxNTU4Mg.GEkrJm.eSrI1dy9FXU22oMAg4YVgQGo7bR-3985XDnmUs";

const PREFIX = "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

function parseDuration(value) {
  const match = value?.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multiplier = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000
  }[unit];

  const duration = amount * multiplier;

  if (!Number.isSafeInteger(duration) || duration <= 0) return null;
  if (duration > 28 * 24 * 60 * 60 * 1000) return null;

  return duration;
}

function makeEmbed(title, description, color = 0xE53935) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

client.once("ready", () => {
  console.log("--------------------------------");
  console.log(`BOT AKTIF: ${client.user.tag}`);
  console.log(`Bot ID: ${client.user.id}`);
  console.log("--------------------------------");

  client.user.setActivity("!yardım | Moderasyon");
});

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLocaleLowerCase("tr-TR");

  if (!command) return;

  const member = message.member;
  const me = message.guild.members.me;

  try {
    // Herkesin kullanabilecegi komutlar
    if (command === "ping") {
      return message.reply(`🏓 Pong! Gecikme: ${client.ws.ping} ms`);
    }

    if (command === "yardım" || command === "yardim") {
      const embed = makeEmbed(
        "🛡️ Moderasyon Botu | Komutlar",
        [
          "**Genel**",
          "`!ping` — Bot gecikmesini gösterir.",
          "`!yardım` — Komut listesini gösterir.",
          "",
          "**Moderasyon**",
          "`!at @üye [sebep]` — Üyeyi sunucudan atar.",
          "`!yasakla @üye [sebep]` — Üyeyi yasaklar.",
          "`!yasakkaldır ID` — Kullanıcının yasağını kaldırır.",
          "`!temizle 10` — En fazla 100 mesaj siler.",
          "`!sustur @üye 10m [sebep]` — Üyeyi süreli susturur.",
          "`!susturmakaldır @üye` — Susturmayı kaldırır.",
          "",
          "Süre biçimleri: `30s`, `10m`, `2h`, `1d`",
          "Moderasyon komutları ilgili Discord yetkisini gerektirir."
        ].join("\n")
      );

      return message.reply({ embeds: [embed] });
    }

    // Moderasyon komutlari icin yetki kontrolu
    const permissionMap = {
      at: PermissionFlagsBits.KickMembers,
      yasakla: PermissionFlagsBits.BanMembers,
      yasakkaldır: PermissionFlagsBits.BanMembers,
      yasakkaldir: PermissionFlagsBits.BanMembers,
      temizle: PermissionFlagsBits.ManageMessages,
      sustur: PermissionFlagsBits.ModerateMembers,
      susturmakaldır: PermissionFlagsBits.ModerateMembers,
      susturmakaldir: PermissionFlagsBits.ModerateMembers
    };

    const requiredPermission = permissionMap[command];
    if (!requiredPermission) return;

    if (!member.permissions.has(requiredPermission)) {
      return message.reply("❌ Bu komutu kullanmak için yetkin yok.");
    }

    const target = message.mentions.members.first();
    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi.";

    // Mesaj temizleme
    if (command === "temizle") {
      const amount = Number(args[0]);

      if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
        return message.reply("Kullanım: `!temizle 1-100`");
      }

      if (!me.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply("❌ Botta Mesajları Yönet yetkisi yok.");
      }

      const deleted = await message.channel.bulkDelete(amount, true);
      const reply = await message.channel.send(
        `🧹 ${deleted.size} mesaj silindi.`
      );

      setTimeout(() => reply.delete().catch(() => {}), 5000);
      return;
    }

    // Yasak kaldirma
    if (command === "yasakkaldır" || command === "yasakkaldir") {
      const userId = args[0];

      if (!/^\d{17,20}$/.test(userId || "")) {
        return message.reply("Kullanım: `!yasakkaldır KULLANICI_ID`");
      }

      if (!me.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply("❌ Botta Üyeleri Yasakla yetkisi yok.");
      }

      await message.guild.members.unban(userId, "Moderasyon karari");
      return message.reply(`✅ \`${userId}\` kullanıcısının yasağı kaldırıldı.`);
    }

    // Diger moderasyon komutlari icin hedef uye
    if (!target) {
      return message.reply("❌ Lütfen bir üyeyi etiketle.");
    }

    if (target.id === message.author.id) {
      return message.reply("❌ Bu işlemi kendine uygulayamazsın.");
    }

    if (target.id === client.user.id) {
      return message.reply("❌ Bu işlemi bota uygulayamazsın.");
    }

    if (target.id === message.guild.ownerId) {
      return message.reply("❌ Sunucu sahibine bu işlem uygulanamaz.");
    }

    if (target.roles.highest.position >= member.roles.highest.position &&
        message.guild.ownerId !== message.author.id) {
      return message.reply("❌ Rolü sana eşit veya senden yüksek olan üyeye işlem uygulayamazsın.");
    }

    // Uye atma
    if (command === "at") {
      if (!me.permissions.has(PermissionFlagsBits.KickMembers)) {
        return message.reply("❌ Botta Üyeleri At yetkisi yok.");
      }

      if (!target.kickable) {
        return message.reply("❌ Bu üyeyi atamıyorum. Botun rolünü kontrol et.");
      }

      await target.kick(reason);
      return message.reply(`👢 **${target.user.tag}** sunucudan atıldı.\nSebep: ${reason}`);
    }

    // Uye yasaklama
    if (command === "yasakla") {
      if (!me.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply("❌ Botta Üyeleri Yasakla yetkisi yok.");
      }

      if (!target.bannable) {
        return message.reply("❌ Bu üyeyi yasaklayamıyorum. Botun rolünü kontrol et.");
      }

      await target.ban({ reason });
      return message.reply(`🔨 **${target.user.tag}** yasaklandı.\nSebep: ${reason}`);
    }

    // Sureli susturma
    if (command === "sustur") {
      const duration = parseDuration(args[1]);

      if (!duration) {
        return message.reply("Kullanım: `!sustur @üye 10m [sebep]`\nEn fazla 28 gün.");
      }

      if (!me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply("❌ Botta Üyeleri Zaman Aşımına Uğrat yetkisi yok.");
      }

      if (!target.moderatable) {
        return message.reply("❌ Bu üyeyi susturamıyorum. Botun rolünü kontrol et.");
      }

      const timeoutReason = args.slice(2).join(" ") || "Sebep belirtilmedi.";
      await target.timeout(duration, timeoutReason);

      return message.reply(
        `🔇 **${target.user.tag}** susturuldu.\nSüre: ${args[1]}\nSebep: ${timeoutReason}`
      );
    }

    // Susturma kaldirma
    if (command === "susturmakaldır" || command === "susturmakaldir") {
      if (!me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply("❌ Botta Üyeleri Zaman Aşımına Uğrat yetkisi yok.");
      }

      if (!target.moderatable) {
        return message.reply("❌ Bu üyede susturma kaldırılamıyor. Botun rolünü kontrol et.");
      }

      await target.timeout(null, "Susturma moderatör tarafından kaldırıldı.");
      return message.reply(`🔊 **${target.user.tag}** kullanıcısının susturması kaldırıldı.`);
    }
  } catch (error) {
    console.error("Komut hatasi:", error);

    if (error.code === 50013) {
      return message.reply(
        "❌ Botun yetkisi yetersiz. Sunucu ayarlarından botun rolünü ve izinlerini kontrol et."
      ).catch(() => {});
    }

    if (error.code === 10013) {
      return message.reply("❌ Kullanıcı bulunamadı veya geçersiz kullanıcı ID'si.").catch(() => {});
    }

    return message.reply(
      "❌ İşlem başarısız oldu. Botun rol sırasını ve yetkilerini kontrol et."
    ).catch(() => {});
  }
});

client.login(TOKEN).catch(error => {
  console.error("Discord giris hatasi:", error);
});
