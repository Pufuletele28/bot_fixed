const { Client, Message, MessageEmbed , discord} = require("discord.js");
const fs = require("fs");
const path = require('path');
const questionDir = path.join(__dirname, '../../questions/');
const responseReactions = ['🇦', '🇧', '🇨', '🇩', '🇪'];
const maxRespnses = responseReactions.length;
const config = require("../../config/config.json");

module.exports = {
  name: "quiz",
  description: "Have a quiz through the bot",
  useage: "quiz",
  category : "information",
  /**
   * @param {Client} client
   * @param {Message} message
   * @param {String[]} args
   */
   run: async (client, message, args) => {
       /* Random number in range */
function randRange(min, max) {
    const num = Math.random() * (max - min) + min;
    return Math.floor(num);
  }
  
  /* Fetch a random question */
  function getRandomQuestion() {
    let randomFiles = fs.readdirSync(questionDir);
    const randomFileName = randomFiles[randRange(0, randomFiles.length)];
    const questionFile = fs.readFileSync(path.join(questionDir, randomFileName));
    return JSON.parse(questionFile);
  }
  
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = randRange(0, i);
        [arr[j], arr[i]] = [arr[i], arr[j]];
    }
  }
  /* Format a question for being sent as a message */
  function questionFormat(arr) {
    let builtString = ``;
    let upTo = arr.length <= maxRespnses ? arr.length : maxRespnses;
  
    if (arr.length == 0) return constructedString;
  
    for (let i = 0; i < upTo; i++) {
        builtString = builtString + responseReactions[i] + ' ' + arr[i] + '\n';
    }
  
    return builtString;
  }
  
    let randQ = getRandomQuestion();    /* Get a random question */
    let upTo = randQ.responses.length <= maxRespnses ? randQ.responses.length : maxRespnses;
    let correctReact = null;            /* Used for determining the correct reaction */
    let allReacts = [];                 /* All possible reactions for this question */

    if (upTo < 2) return;               /* This is a quiz, there needs to be at least 2 responses */

    shuffle(randQ.responses);           /* Randomize answer order */

    for (let i = 0; i < upTo; i++) {
        allReacts.push(responseReactions[i]);
        if (randQ.responses[i] == randQ.answer)
            correctReact = responseReactions[i];
    }

    message.channel.send('Question: ' + randQ.question + '\n'
              + questionFormat(randQ.responses) + '\n'
              + '_React within **' + config.questionTime / 1000 + '  seconds** with your answer!_')
    .then(async msg => {
        const filter = (reaction, user) => {
            return allReacts.includes(reaction.emoji.name) && user.id == message.author.id;
        };
        
        await msg.awaitReactions(filter, {max: 1, time: config.questionTime, errors: ['time']})
            .then(collected => {
                const reaction = collected.first();
                
                if (reaction.emoji.name == correctReact)
                    message.reply("correct!");
                else
                    message.reply("incorrect!");
                })
                .catch(collected => {
                    message.reply("no response received!");
                })
    })
    .catch();
}};
