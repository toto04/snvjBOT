import EventEmitter from 'events'
import discord from 'discord.js'
import Song from './ytSong'

const IDLE = 0;
const PENDING = 1;
const PLAYING = 2;
const PAUSE = 3;

class Player extends EventEmitter {
  defaultChannel?: discord.TextChannel;
  client: discord.Client;
  state?: number;
  queue: Song[];
  dispatcher?: discord.StreamDispatcher;

  constructor(client: discord.Client) {
    super();

    for (let channel of client.channels.array()) {
      if (channel.id == process.env.DEFAULT_CHANNEL && channel instanceof discord.TextChannel) {
        this.defaultChannel = channel
        break;
      }
    }

    this.client = client;
    this.on('stateChange', (newState) => {
      // Stati possibili:
      // idle = 0;
      // pending = 1;
      // playing = 2;
      // pause = 3;
      this.state = newState;
      console.log("Nuovo stato: " + this.state);
    })
    this.queue = [];
  }

  push(song: Song) {
    this.queue.push(song);
    if (this.queue.length == 1) {
      this.start();
    }
  }

  loop(song: Song){
    this.push(song)
    if (!this.dispatcher) {
      console.error('wtf, how did this happen')
      return
    }
    this.dispatcher.prependOnceListener('end', (reason: string) => {
      if (reason == 'skipped') return
      this.loop(song)
    })
  }

  pause() {
    if (!this.dispatcher) {
      console.log("Nessun brano in riproduzione");
      return;
    }
    if (this.state == PAUSE) {
      console.log('Già in pausa');
      return;
    }
    this.emit('stateChange', PAUSE)
    this.dispatcher.pause();
  }

  resume() {
    if (this.state != PAUSE && this.defaultChannel) {
      this.defaultChannel.send("Nessuna canzone in coda");
      return;
    }

    if (this.dispatcher != undefined) {
      this.dispatcher.resume()
    } else {
      this.start();
    }
    this.emit('stateChange', PLAYING)
  }

  start() {
    if (this.dispatcher) {
      console.log("Something is already playing");
    }
    if (!this.queue[0].ready) {
      this.emit('stateChange', PENDING);
      if (this.defaultChannel) {
        this.defaultChannel.send('Waiting for a song to download')
        .then((m) => {
          if (m instanceof discord.Message) m.delete(2000)
        });
      }
      this.queue[0].on('ready', () => {
        this.start();
      })
      return;
    }

    if (this.client.voiceConnections.array().length == 0) {
      if (this.defaultChannel) this.defaultChannel.send(
        `No voice channel! Use the command
        \`\`\`Markdown
        !summon
        \`\`\`
        while in a voice channel to summon the bot!`
      )
      this.emit('stateChange', PAUSE);
      return;
    }

    //Finalmente, riproduci il file
    this.emit('stateChange', PLAYING)
    console.log('Now playing ' + this.queue[0].title);
    if (this.defaultChannel) {
      this.defaultChannel.send('Now playing! ' + this.queue[0].title)
      .then((m) => {
        if (m instanceof discord.Message) m.delete(2000)
      });
    }
    this.dispatcher = this.client.voiceConnections.array()[0].playFile(this.queue[0].absolutePath);
    this.dispatcher.on('end', (reason: string) => {
      if (reason == 'skipped') return;
      console.log("Ended song");
      this.emit('stateChange', IDLE);
      this.skip();
    })
  }

  skip() {
    if (!this.dispatcher) return
    this.dispatcher.end('skipped')
    this.dispatcher = undefined
    console.log("dispatcher destroyed! Skipping")
    this.queue.shift()
    if (this.queue.length > 0) {
      this.start()
    }
  }
}

export default Player
