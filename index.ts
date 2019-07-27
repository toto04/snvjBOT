import discord from 'discord.js'
import commands from './commands'
import Player from './player'
import http from 'http'
import fs from 'fs'

const client = new discord.Client();

var summonChar = "!"
var player: Player

client.on("ready", () => {
  fs.exists('audio_cache', e => {
    if (!e) {
      console.log('creating audio cache')
      fs.mkdirSync('audio_cache')
      fs.writeFileSync('audio_cache/sizes.json', '[]')
    }
  })

  console.log("Snavajab bot up to work!");
  console.log(client.user.username);

  player = new Player(client);

  client.user.setPresence({
    game: { name: "music bot", type: 'PLAYING' },
    status: 'online',
    afk: true
  });
})

client.on("message", (message) => {
  if (message.content[0] != summonChar) return; //return if it's not a command
  if (!message.guild) return; //return if it's a bot

  let spcIdx = message.content.indexOf(' ');
  let command: string 
  let payload: string | undefined

  if (spcIdx >= 0) {
    command = message.content.substr(1, message.content.indexOf(' ') - 1);
    payload = message.content.substr(message.content.indexOf(' ') + 1, message.content.length);
  } else {
    command = message.content.substr(1, message.content.length);
  }

  if (commands[command]) commands[command].exec(message, player, payload)
  else (message.reply(`Unknows command, type ${summonChar}help for a list of available`))
})

//QUESTO È IL MIO TOKEN E DI NESSUN ALTRO. No sul serio, questo token serve al login con il bot
client.login(process.env.TOKEN);

const port = process.env.PORT || 5000

http.createServer((req, res) => {
  console.log('lmao')
  res.end('not implemented')
}).listen(port)

setInterval(() => {
  http.get(`http://snvjbot.herokuapp.com`)
}, 300000)