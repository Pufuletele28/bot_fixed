const { Client, Message, MessageEmbed , discord} = require("discord.js");

module.exports = {
  name: "say",
  description: "Say stuff through the bot",
  useage: "say",
  category : "information",
  /**
   * @param {Client} client
   * @param {Message} message
   * @param {String[]} args
   */
   run: async (client, message, args) => {
    const sayEmbed = new MessageEmbed()
        .setAuthor(message.author.tag, message.author.displayAvatarURL({ dyanmic: true }))
        .setDescription(args.join(" "))
        .setTimestamp()
        .setColor("RANDOM");
    message.channel.send(sayEmbed);
  },
};
