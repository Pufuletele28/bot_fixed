const { Client, Message, MessageEmbed } = require("discord.js");
const Schema = require("../../utils/models/welcome");

module.exports = {
  name: "check-welcome-channel",
  description: "",
  usage: "",
  aliases: ["cwchannel"],
  category: "welcome_leave",
  /**
   * @param {Client} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    if (!message.member.permissions.has("MANAGE_MESSAGES")) {
      return message.channel
        .send(
          new MessageEmbed()
            .setColor("RED")
            .setAuthor(message.author.tag)
            .setDescription(
              "**You Dont Have The Permissions To Warn Users! - [MANAGE_MESSAGES]**"
            )
            .setFooter("Coded by: Sn00pCatt")
        )
        .then((msg) => {
          msg.delete({ timeout: 10000 });
        });
    }

    Schema.findOne({ Guild: message.guild.id }, async (err, data) => {
      if (!data)
        return message.channel.send(
          new MessageEmbed()
            .setColor("RED")
            .setAuthor(message.author.tag)
            .setDescription("**This Guild has no data Stored!!**")
            .setFooter("Coded by: Sn00pCatt")
        );
      const channel = client.channels.cache.get(data.Channel);

      const welcome = new MessageEmbed()
        .setColor("RANDOM")
        .setTitle("Welcome Channel")
        .setDescription(`Welcome Channel => ${channel}`)
        .setImage("https://i.imgur.com/Wj5IGQL.jpeg")
        .setFooter("Coded by: Sn00pCatt");
      message.channel.send(welcome);
    });
  },
};
