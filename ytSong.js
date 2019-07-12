const fs = require('fs');
const https = require('https');
const { parse } = require('node-html-parser');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const EventEmitter = require('events');

// var testurl = 'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
// const flg = ['--format=249'] //flags for the command, Il formato 249 è l'audio a minor bitrate

var cacheDir = 'audio_cache';

const sizesPath = `${cacheDir}/sizes.json` // TODO: USE PATH.JS GOD FUCK IT
const bitrate = 72

class Song extends EventEmitter {
  static check(id) {
    var check = new Promise((resolve, reject) => {
      //checks if the thumbnail exists
      https.get('https://img.youtube.com/vi/' + id + '/0.jpg', (res) => {
        if (res.statusCode == 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
    });
    return check;
  }

  static search(terms) {
    var search = new Promise((resolve, reject) => {
      var searchURL = 'https://www.youtube.com/results?search_query=' + terms;
      https.get(searchURL, (res) => {
        // get the resulting search page
        res.setEncoding('utf8');
        var rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        })
        res.on('end', () => {
          //once the page is loaded search for the first result
          try {
            var doc = parse(rawData);
            var result = doc.querySelectorAll('.yt-uix-tile-link')[0];
            var id = result.rawAttrs.substring(15, 26);
            resolve(id);
          } catch (e) {
            //if no result is found
            reject(e)
          }
        })
      })
    });
    return search;
  }

  constructor(title) {
    super();

    this.ready = false;
    this.absolutePath = '';
    this.title = 'Pending... (${title})'
    this.on('ready', () => {
      this.ready = true
    }) //set ready to true when ready event is emitted

    var match = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu\.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/.exec(title)
    if (match) {
      this.id = match[5]
      this.download()
    } else {
      Song.search(title).then((newID) => {
        this.id = newID;
        this.download();
      }, e => {
        this.emit('error', e)
      })
    }
  }

  download() {
    console.log("Retrieving informations...");
    var url = 'https://www.youtube.com/watch?v=' + this.id;

    ytdl.getInfo(url, (err, info) => {
      if (err) {
        console.log(this.id);
        throw err;
      }
      var id = this.id;
      var title = info.player_response.videoDetails.title
      this.title = title;
      title = title.replace(/\|/g, "_");
      title = title.replace(/\//g, "_");

      var filename = title + '-' + id;

      console.log(filename);

      var fileSize = 0;
      var path = `${cacheDir}/${filename}.mp3`
      this.absolutePath = __dirname + '/' + path;
      if (fs.existsSync(path)) {
        fileSize = fs.statSync(path).size;
      }

      var sizes = JSON.parse(fs.readFileSync(sizesPath, 'utf8'));
      if (sizes[filename] != fileSize) {
        var format = ytdl.chooseFormat(info.formats, {
          quality: 'highest'
        })
        var ext = '.' + format.container;

        var wStream = fs.createWriteStream(cacheDir + '/' + filename + ext);
        ytdl.downloadFromInfo(info, { format })
          .on('progress', (len, dow, tot) => {
            if (process.stdout.isTTY) {
              var percent = (dow / tot * 100).toFixed(2);
              process.stdout.cursorTo(0);
              process.stdout.clearLine(1);
              process.stdout.write(percent + '%');
            }
          })
          .pipe(wStream)

        wStream.on('close', () => {
          console.log("TEATEASF" + this.absolutePath);
          console.log('\nFinished downloading file ' + "\x1b[31m" + filename + "\x1b[0m");
          ffmpeg(__dirname + '/' + cacheDir + '/' + filename + ext)
            .audioBitrate(bitrate)
            .toFormat('mp3')
            .on('end', () => {
              console.log('\nFinished converting!');
              this.emit('ready')

              fileSize = fs.statSync(path).size
              sizes = JSON.parse(fs.readFileSync(sizesPath, 'utf8'));
              sizes[filename] = fileSize

              fs.writeFile(sizesPath, JSON.stringify(sizes, null, 2), () => {
                console.log("JSON updated!");
              })

              fs.unlink(cacheDir + '/' + filename + ext, (err) => { //Removes the temporary video file
                //if (err) throw err;
                console.log("File eliminato con successo!");
              })
            })
            .on('error', (e) => {
              console.log(e);
            })
            .saveToFile(this.absolutePath)
        })
      } else {
        console.log("File already downloaded and converted!");
        this.emit('ready')
      }
    })
  }
}

module.exports = Song;
