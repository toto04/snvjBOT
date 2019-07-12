const EventEmitter = require('events');

const IDLE = 0;
const PENDING = 1;
const PLAYING = 2;
const PAUSE = 3;

class Player extends EventEmitter {
  constructor(client) {
    super();

    for (var i = 0; i < client.channels.array().length; i++) {
      if (client.channels.array()[i].id == '348145753514049536') {
        this.defaultChannel = client.channels.array()[i];
        break;
      }
    }

    this.client = client;
    this.state = false;
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

  push(song) {
    this.queue.push(song);
    if (this.queue.length == 1) {
      this.start();
    }
  }

  pause() {
    if (!this.dispatcher) {
      console.log("Nessun brano in riproduzione");
      return;
    }
    if (this.status == PAUSE) {
      console.log('Già in pausa');
      return;
    }
    this.emit('stateChange', PAUSE)
    this.dispatcher.pause();
  }

  resume() {
    if (this.state != PAUSE) {
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
      this.queue[0].on('ready', () => {
        this.start();
      })
      return;
    }

    if (this.client.voiceConnections.array().length == 0) {
      this.defaultChannel.send(
        "Nessun canale vocale! Usa il comando\n" +
        "```Markdown\n" +
        "!join\n" +
        "```" +
        "mentre si è all'interno di un canale per far entrare il bot!"
      )
      this.emit('stateChange', PAUSE);
      return;
    }

    //Finalmente, riproduci il file
    this.emit('stateChange', PLAYING)
    console.log('Now playing ' + this.queue[0].title);
    this.dispatcher = this.client.voiceConnections.array()[0].playFile(this.queue[0].absolutePath);
    this.dispatcher.on('end', (reason) => {
      if (reason == 'skipped') return;
      console.log("Ended song");
      this.emit('stateChange', IDLE);
      this.skip();
    })
  }

  skip() {
    this.dispatcher.end('skipped')
    this.dispatcher = undefined;
    console.log("dispatcher destroyed! Skipping");
    this.queue.shift();
    if (this.queue.length > 0) {
      this.start();
    }
  }
}

module.exports = Player;
