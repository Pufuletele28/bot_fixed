const Schema1 = require("../utils/models/welcome");
const { MessageEmbed, MessageAttachment } = require("discord.js");
const client = require("..");

client.on("guildMemberAdd", async (member) => {

  // wecome bot
  Schema1.findOne({ Guild: member.guild.id }, async (e, data) => {
    if (!data) return;

    let WELCOME = new MessageEmbed()
      .setTitle(`${member.user.username} Has Joined ${member.guild.name}`)
      .setDescription(
        `📜 Welcome To Our Server ${member.user} we are happy to have you! you are member number ${member.guild.memberCount}!\n \n 📜 ⊱ ──────────ஓ๑♡๑ஓ────────── ⊰`
      )
      .setColor("RED")
      .setTimestamp()
      .setFooter("Thanks For Joining!");
      
    const channel = member.guild.channels.cache.get(data.Channel);
    channel.send(WELCOME);
  });
});
