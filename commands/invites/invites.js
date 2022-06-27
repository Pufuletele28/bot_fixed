const { Message } = require('discord.js');
const { rawEmb, colors, emotes } = require('../../config/utilities');

module.exports = {
    name: 'invites',
    description: 'shows you your invites',
    category : "invites",
    useage: "invites",

    run: async (client, msg, args) => {
        let user;
        let emb = rawEmb(msg)
        if (msg.mentions.users.first()) {
            user = msg.mentions.users.first();
        } else { user = msg.author; }

        if (user.bot) {
            return msg.channel.send(emb.setColor(colors.error))
        }

        var db = await msg.client.database.member_cache.getConfig(user.id, msg.guild.id);
        emb.setTitle(`${user.username}´s Invites`)
            .setDescription(`**${db.TOTAL -db.LEAVED}** ${db.TOTAL > 1 ? 'Invites' : 'Invite'}, **${db.FAKE}** Faked, **${db.BONUS}** Bonus, **${db.TOTAL}** Total Invites`)
        msg.channel.send(emb)
    }
};