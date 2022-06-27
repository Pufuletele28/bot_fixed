const Discord = require("discord.js");
const { Client, Message, MessageEmbed, Collection } = require("discord.js");
const fs = require("fs");
const path = require('path');
const db = require("quick.db")
const colors = require("colors");
const configg = require("./configg.json");
const button = require('discord-buttons')
const { Member, Settings, syncDatabase } = require('./database/dbInit');
const config = require("./config/config.json");
const map = new Map();
const client = new Client({
  messageCacheLifetime: 60,
  fetchAllMembers: false,
  messageCacheMaxSize: 10,
  restTimeOffset: 0,
  restWsBridgetimeout: 100,
  shards: "auto",
  disableEveryone: true,
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});
require("discord-buttons")(client);

// MongoDB
const mongoose = require("mongoose");
mongoose
  .connect(config.mongoose, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(console.log("MongoDB Conneted.."));
const prefix = config.prefix;
client.prefix = prefix;
client.config = config;
const token = config.token;
module.exports = client;
client.commands = new Collection();
client.aliases = new Collection();
client.events = new Discord.Collection();
client.cooldowns = new Discord.Collection();
client.categories = fs.readdirSync("./commands/");

//Loading files, with the client variable like Command Handler, Event Handler, ...
["command", "distube"].forEach((handler) => {
  require(`./handlers/${handler}`)(client);
});

// host bot

// const express = require("express")
// const app = express();

// app.get("/", (req, res) => {
//   res.send(`Pinging`)
// })

// app.listen(() => {
//   console.log(`Server Started..`)
// })

//databases setups
const Enmap = require("enmap");
client.settings = new Enmap({
  name: "settings",
  dataDir: "./databases/settings",
});
client.setups = new Enmap({
  name: "setups",
  dataDir: "./databases/setups",
});
client.infos = new Enmap({
  name: "infos",
  dataDir: "./databases/infos",
});

const invites = new Collection([
  ["dummy", []]
]);
invites.delete('dummy');

var member_cache = new Collection();
var settings_cache = new Collection();

Reflect.defineProperty(settings_cache, "getConfig", {
  /**
   * @param {number} id User ID
   * @returns {Model} new User
   */
  value: async function(id) {
      var server = settings_cache.get({ GID: id });
      if (!server) server = await Settings.findOne({ where: { GID: id } });
      if (!server) {
          server = await Settings.create({ GID: id });
          settings_cache.set({ GID: id }, server);
      }
      return server;
  }
});
//==================================================================================================================================================
Reflect.defineProperty(member_cache, "getConfig", {
  /**
   * @param {number} id Guild ID
   *  @param {number} uid Channel ID
   * @returns {Model} new User
   */
  value: async function(mid, gid) {
      let id = `${mid}${gid}`
      var member = member_cache.get({ MID: id })
      if (!member) member = await Member.findOne({ where: { MID: id } });

      if (!member) {
          member = await Member.create({ MID: id });
          member_cache.set({ MID: id }, member);
      }
      return member;
  }
});

//==================================================================================================================================================
//Sync
const initDatabase = async() => {
  await syncDatabase();

  try {
      for (let entr of(await Member.findAll())) { member_cache.set(entr.MID, entr); }
      for (let entr of(await Settings.findAll())) { settings_cache.set(entr.GID, entr); }

      console.log(" > 🗸 Cached Database Entries");
  } catch (e) {
      console.log(" > ❌ Error While Caching Database")
      console.log(e);
  }
}

client.database = { member_cache, settings_cache };

const start = async() => {
  try {
      console.log("Logging in...");
      await client.login(token).catch(e => {
          switch (e.code) {
              case 500:
                  console.log(" > ❌ Fetch Error");
                  break;
              default:
                  console.log(" > ❌ Unknown Error");
                  break;
          }
          setTimeout(() => { throw e }, 5000);
      });
      await initDatabase();
  } catch (e) {
      console.log(e);
  }
}
start();



client.on("ready", async() => {
  console.log(" >  Logged in as: " + client.user.tag);

  for (const guild of client.guilds.cache.array()) {
      invites.set(guild.id, await guild.fetchInvites().then(col => col.array()))
  }
  console.log(" >  Checked Invites");
});

client.on('guildCreate', async guild => {
  invites.set(guild.id, await guild.fetchInvites().then(col => col.array()))
})

async function updateInvites(inv) {
  invites.set(inv.guild.id, await inv.guild.fetchInvites().then(c => c.array()).catch(e => []))
}

client.on("inviteCreate", updateInvites);
client.on("inviteDelete", updateInvites);

// client.on("guildMemberAdd", async member => {
//   if (member.user.bot) return;
//   let channel;

//   const { guild } = member;
//   var old = invites.get(guild.id);
//   var updated = await guild.fetchInvites().then(c => c.array());
//   let text;

//   let settings = await client.database.settings_cache.getConfig(guild.id);
//   if (settings.WELCOMECHANNEL) channel = await guild.channels.resolve(settings.WELCOMECHANNEL)
//   var invite = updated.find((inv, index) => inv.uses !== old[index].uses)
//   if (!invite) { text = `I couldn't find out the invite` } else {
//       const fake = (Date.now() - member.createdAt) / (1000 * 60 * 60 * 24) <= 3 ? true : false
//       let memberData = await client.database.member_cache.getConfig(member.id, guild.id);
//       const inviter = invite.inviter
//       if (inviter) {
//           let inviterData = await client.database.member_cache.getConfig(inviter.id, guild.id)
//           inviterData.TOTAL += 1
//           memberData.INVITER = inviter.id
//           if (fake) inviterData.FAKE += 1

//           await inviterData.save()
//           await memberData.save()
//           text = `${member} invited by ${inviter}`
//       }
//   }
//   if(!text) text = `${member} Joined!`
//   console.log(text)
//   let emb = new MessageEmbed().setDescription(text)
//   if (channel) channel.send(emb)
// });

client.on("guildMemberRemove", async member => {
  let { guild } = member
  let memberData = await client.database.member_cache.getConfig(member.id, guild.id)
  if (!memberData.INVITER) return

  let inviterData = await client.database.member_cache.getConfig(memberData.INVITER, guild.id)
  inviterData.LEAVED += 1
  await inviterData.save()
});
/// giveawat bot

// Initialise discord giveaways
const { GiveawaysManager } = require("discord-giveaways");
client.giveawaysManager = new GiveawaysManager(client, {
  updateCountdownEvery: 3000,
  default: {
    botsCanWin: false,
    embedColor: "#FF0000",
    reaction: "🎉",
  },
});

/* Client's GiveawaysManager Events */
client.giveawaysManager.on(
  "giveawayReactionAdded",
  async (giveaway, reactor, messageReaction) => {
    if (reactor.user.bot) return;
    try {
      if (giveaway.extraData) {
        await client.guilds.cache
          .get(giveaway.extraData.server)
          .members.fetch(reactor.id);
      }
      reactor.send(
        new Discord.MessageEmbed()
          .setTimestamp()
          .setTitle("Entery Approved! | You have a chance to win!!")
          .setDescription(
            `Your entery to [This Giveaway](https://discord.com/channels/${giveaway.guildID}/${giveaway.channelID}/${giveaway.messageID}) has been approved!`
          )
          .setFooter("Coded By Sn00pCatt")
          .setTimestamp()
      );
    } catch (error) {
      const guildx = client.guilds.cache.get(giveaway.extraData.server);
      messageReaction.users.remove(reactor.user);
      reactor.send(
        new Discord.MessageEmbed()
          .setTimestamp()
          .setTitle(":x: Entery Denied | Databse Entery Not Found & Returned!")
          .setDescription(
            `Your entery to [This Giveaway](https://discord.com/channels/${giveaway.guildID}/${giveaway.channelID}/${giveaway.messageID}) has been denied as you did not join **${guildx.name}**`
          )
          .setFooter("Coded By Sn00pCatt")
      );
    }
  }
);
// Check if user reacts on an ended giveaway
client.giveawaysManager.on(
  "endedGiveawayReactionAdded",
  (giveaway, member, reaction) => {
    reaction.users.remove(member.user);
    member.send(`**Aw snap! Looks Like that giveaway has already ended!**`);
  }
);
// Dm our winners
client.giveawaysManager.on("giveawayEnded", (giveaway, winners) => {
  winners.forEach((member) => {
    member.send(
      new Discord.MessageEmbed()
        .setTitle(`🎁 Let's goo!`)
        .setDescription(
          `Hello there ${member.user}\n I heard that you have won **[[This Giveaway]](https://discord.com/channels/${giveaway.guildID}/${giveaway.channelID}/${giveaway.messageID})**\n Good Job On Winning **${giveaway.prize}!**\nDirect Message the host to claim your prize!!`
        )
        .setTimestamp()
        .setFooter(member.user.username, member.user.displayAvatarURL())
    );
  });
});
// Dm Rerolled winners
client.giveawaysManager.on("giveawayRerolled", (giveaway, winners) => {
  winners.forEach((member) => {
    member.send(
      new Discord.MessageEmbed()
        .setTitle(`🎁 Let's goo! We Have A New Winner`)
        .setDescription(
          `Hello there ${member.user}\n I heard that the host rerolled and you have won **[[This Giveaway]](https://discord.com/channels/${giveaway.guildID}/${giveaway.channelID}/${giveaway.messageID})**\n Good Job On Winning **${giveaway.prize}!**\nDirect Message the host to claim your prize!!`
        )
        .setTimestamp()
        .setFooter(member.user.username, member.user.displayAvatarURL())
    );
  });
});
// When They Remove Reaction
client.giveawaysManager.on(
  "giveawayReactionRemoved",
  (giveaway, member, reaction) => {
    return member.send(
      `❓ Hold Up Did You Just Remove a Reaction From A Giveaway?`
    );
  }
);

client.on("message", async (message) => {
  if (message.author.bot) return;
  let words = db.get(`words_${message.guild.id}`)
  let yus = db.get(`message_${message.guild.id}`)
  if (yus === null) {
    yus = ":x: | **This word is not allowed here {user-mention}**"
  }
  if (message.content.startsWith(prefix + "addword")) return;
  if (message.content.startsWith(prefix + "delword")) return;
  if (message.content.startsWith(prefix + "setwarnmsg")) return;
  if (message.content.startsWith(prefix + "words")) return;
  let pog = yus.split("{user-mention}").join("<@" + message.author.id + ">").split("{server-name}").join(message.guild.name).split("{user-tag}").join(message.author.tag).split("{user-username}").join(message.author.username)
  if (words === null) return;
  function check(msg) {
    return words.some(word => message.content.toLowerCase().split(" ").join("").includes(word.word.toLowerCase()))
  }
  if (check(message.content) === true) {
    message.delete()
    message.channel.send(pog)
  }
});

function checksettings(){
 if(!configg.discord.verifychannelid) {
        console.error("[GymRats Bot] Verify channel ID is not defined!")
        client.destroy()
        return
        
    } else if(!configg.discord.verifiedroleid) {
        console.error("[GymRats Bot] Verified role ID is not defined!")
        client.destroy()
        return
        
    } else if(!configg.discord.rolewithpermissionsid) {
        console.error("[GymRats Bot] Role with Permissions ID is not defined!")
        client.destroy()
        return
        
    } else if(!configg.discord.serverid) {
        console.error("[GymRats Bot] Server ID is not defined!")
        client.destroy()
        return
        
    }
}

client.on("message", (message) => {
    if(message.content === configg.discord.prefix+"setup") {
        if(!message.member.roles.cache.some(r => r.id === configg.discord.rolewithpermissionsid)) {
            message.reply('You cannot use this command!')
            message.delete()
            return
        }
        
        let verifybutton = new button.MessageButton().setStyle("green").setLabel("Verify").setID("verifybutton")
        let verifychannel = client.channels.cache.get(configg.discord.verifychannelid)
        let myembed = new Discord.MessageEmbed().setDescription('Welcome to GymRats!\nYour amazing fitness journey starts right here, on our official Discord server!\nPlease click on the button below to get verified!').setColor("ORANGE").setImage("https://i.imgur.com/vuo4GGJ.jpeg");
        message.delete()
        verifychannel.send({ button: verifybutton, embed: myembed });
    }
})


client.on('clickButton', async (button) => {
    let guild = client.guilds.cache.get(configg.discord.serverid)
    let member = guild.members.cache.get(button.clicker.user.id)
    if(member.roles.cache.some(r => r.id === configg.discord.verifiedroleid)) return member.send("```[GymRats BOT] You are already verified.```")
    if (button.id === 'verifybutton') {
        member.roles.add(configg.discord.verifiedroleid)
    }
});

client.login(token);
