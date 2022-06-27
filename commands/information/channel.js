const { Message } = require('discord.js');
const { rawEmb, emotes, colors } = require('../../config/utilities');

module.exports = {
    name: 'channel',
    commands: ['channel', 'setchannel'],
    description: 'shets channel for invites',
    category : "channel",
    useage: "information",

    /**
     *@document
     * @this
     * @param {Message} msg Nachricht in dem der Befehl geschickt wurde
     * @param {String[]} args Argumente die im Befehl mitgeliefert wurden
     */
     run: async (client, msg, args) => {
        let emb = rawEmb(msg)
        let text;
        var settings = await msg.client.database.settings_cache.getConfig(msg.guild.id);
        let neuChannel = msg.mentions.channels.first()
        if (!neuChannel) return msg.channel.send(emb.setDescription('**please mention a channel**').setColor(colors.error))

        settings.WELCOMECHANNEL = neuChannel.id
        await settings.save()
    }
};