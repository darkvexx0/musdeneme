
require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.once("ready", () => {
  console.log(`${client.user.tag} aktif!`);

  client.user.setActivity("Sunucuya hos geldin!");
});

client.login(process.env.DISCORD_TOKEN);
