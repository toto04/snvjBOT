const discord = require('discord.js');
const Player = require('./player.js');
const Song = require('./ytSong.js');
const http = require('http')
const fs = require('fs')

const client = new discord.Client();

var summonChar = "!"
var player;

var player;

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

  // console.log(arr[5]);
  client.user.setPresence({
    game: { name: "music bot", type: 0 },
    status: 'online',
    afk: true
  });

  player.on('stateChange', (state) => {
    if (state == 1) {
      player.defaultChannel.send('Waiting for a song to download')
        .then((message) => {
          message.delete(2000)
        });
    } else if (state == 2) {
      player.defaultChannel.send('Now playing! ' + player.queue[0].title)
        .then((message) => {
          message.delete(2000)
        });
    }
  })
})

client.on("message", (message) => {
  if (message.content[0] != summonChar) return; //return if it's not a command
  if (!message.guild) return; //return if it's a bot

  var spcIdx = message.content.indexOf(' ');
  var command;
  var payload = '';

  if (spcIdx >= 0) {
    command = message.content.substr(1, message.content.indexOf(' ') - 1);
    payload = message.content.substr(message.content.indexOf(' ') + 1, message.content.length);
  } else {
    command = message.content.substr(1, message.content.length);
  }

  // console.log(message.content);
  // console.log(command);

  // player.test();

  if (command == 'join') {
    // Only try to join the sender's voice channel if they are in one themselves
    if (message.member.voiceChannel) {
      message.member.voiceChannel.join()
        .then((connection) => { // Connection is an instance of VoiceConnection
          message.reply('I have successfully connected to the channel!');
        })
        .catch(console.log);
    } else {
      message.reply('Entra in un canale vocale prima!');
    }
  }

  if (command == 'play') {
    player.push(new Song(payload))
  }

  if (command == 'resume') {
    player.resume();
  }

  if (command == 'pause') {
    player.pause();
  }

  if (command == 'skip') {
    player.skip();
  }

  if (command == 'state') {
    console.log(player.state);
  }

  if (command == 'test') {
    console.log(player.dispatcher);
  }

  if (command == 'queue') {
    var q = '';
    for (var i = 0; i < player.queue.length; i++) {
      q += player.queue[i].title + '\n';
    }
    player.defaultChannel.send(q)
  }

  if (command == 'connec') {
    console.log('\n\n–––––––––––––––––––––––––––––––––––\n\n');
    console.log("Client: " + client.voiceConnections);
    console.log('\n\n–––––––––––––––––––––––––––––––––––\n\n');
    console.log("Player: " + player.client.voiceConnections);
  }
})

//QUESTO È IL MIO TOKEN E DI NESSUN ALTRO. No sul serio, questo token serve al login con il bot
client.login('NTE3NDIyNzU2NDIyMjIxODM0.DuCrtA.XWybrpzNG0mqoj41vOFW-52F9jw');

const port = process.env.PORT || 5000

http.createServer((req, res) => {
  console.log('lmao')
  res.end('not implemented')
}).listen(port)

setInterval(() => {
  http.get(`http://127.0.0.1:${port}`)
}, 1800000)