const fs = require('fs');
const Discord = require('discord.js')
const ethers = require('ethers')
// const config = require('./config.json')
const ZKSTAKE = require('./zkStake.json')
const client = new Discord.Client({
  intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS', 'DIRECT_MESSAGES'],
})

const prefix = '!'

const provider = ethers.getDefaultProvider('kovan')
const stakecontract = new ethers.Contract(
  // config.Contract_Address,
  process.env.Contract_Address,
  ZKSTAKE.abi,
  provider,
)

async function main(args, message, guild, guildId) {
  let { valid, entityId } = await checkWhitelist(args);

  fs.appendFile('store.txt', entityId + ',' + guildId, 'utf8', () => {
    console.log('wrote to file')
  });

  if (valid && typeof valid === "boolean") {
    message.author.send('GM you are verified')

    const member = message.author.id;
    const isMember = guild.members.cache.get(member);

    if (isMember) {
      let role = guild.roles.cache.find(r => r.name === "Verified User");
      isMember.roles.add(role)
      message.reply(`Verified ${message.author.username}`)
    } else  {
      message.reply('You are not part of this guild')
    }
  } else {
    message.reply(`Unable to verify ${message.author.username}`)
  }
}

async function checkWhitelist(message) {
  try {
    const decoded = new Buffer.from(message, 'hex').toString()
    const params = JSON.parse(decoded.toString())
    const r = await stakecontract.verifyIdentityChallenge(
      params.challenge,
      params.nullifierHash,
      params.entityId,
      params.proof,
    )
    return {
      valid: r,
      entityId: params.entityId
    }
  } catch (error) {
    console.log(`Error: ${error}`);
    return false
  }
}


client.on('messageCreate', async function (message) {
  if (message.author.bot) return
  if (!message.content.startsWith(prefix)) return

  let guild;

  // console.log(client.users)
  // console.log(client.channels)

  const commandBody = message.content.slice(prefix.length)
  const args = commandBody.split(' ')
  const command = args.shift().toLowerCase()

  if (command === 'ping') {
    const timeTaken = Date.now() - message.createdTimestamp
    message.reply(`Pong! This message had a latency of ${timeTaken}ms.`)
  } else if (command === 'sum') {
    const numArgs = args.map((x) => parseFloat(x))
    const sum = numArgs.reduce((counter, x) => (counter += x))
    message.reply(`The sum of all the arguments you provided is ${sum}!`)
  } else if (command === 'dm') {
    // let messageContent = message.content.replace("!dm", "")
    console.log(`Message ${message}`);
    const guildId = message.guild.id
    const guild = client.guilds.cache.get(message.guild.id); // get the server's id, needed to add role

    const filter = collected => collected.author.id === message.author.id;
    const msg = await message.member.send('Hello! I am ZK-NFT-BOT 🤖 To verify yourself, run "!verify insert-your-long-string-of-numbers-here"')
    const collector = msg.channel.createMessageCollector({filter, time: 50000})
    collector.on('collect', message => {
      // console.log(`Collected ${message.content}`);
      const commandBody = message.content.slice(prefix.length)
      const args = commandBody.split(' ')
      const command = args.shift().toLowerCase()

      if (command === 'verify') {
        main(args[0], message, guild, guildId)
      }
    });

    // collector.on('end', collected => {
    //   console.log(`Collected ${collected.size} items`);
    // });

  }
  // else if (command === 'verify') {
  //   let valid = await checkWhitelist(args[0])
  //   console.log(valid)
  //
  //   if (valid) {
  //     message.author.send('GM you are verified')
  //
  //     const member = message.author.id;
  //     const isMember = guild.members.cache.get(member);
  //
  //     if (isMember) {
  //       let role = guild.roles.cache.find(r => r.name === "Verified User");
  //       isMember.roles.add(role)
  //       message.reply(`Verified ${message.author.username}`)
  //     } else  {
  //       message.reply('You are not part of this guild')
  //     }
  //
  //   }
  // }

})

// client.login(config.BOT_TOKEN)
client.login(process.env.BOT_TOKEN)
