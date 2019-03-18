const http = require('https');
const Song = require('./ytSong.js')

var playlistId = 'PL92A1C91DC9899431'
var videoArr = []
var globalIndex = 0;

addToArr();

function addToArr(pageToken = '') {

  var api = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2C+contentDetails&maxResults=50&pageToken='
  + pageToken + '&playlistId='
  + playlistId + '&key=AIzaSyAJAJFdORcHVpsyWkUMoFubB0OXAQZJOB0';

  http.get(api, (res) => {
    var raw = '';
    res.on('data', d => {raw += d})
    res.on('end', () => {
      var response = JSON.parse(raw)
      response.items.forEach(vid => {
      //  console.log(vid.contentDetails.videoId);
        videoArr.push(vid.contentDetails.videoId)
      })
      if (response.nextPageToken) {
        addToArr(response.nextPageToken)
      } else {
        next()
      }
    })
  })
}

function next() {
  console.log("\n--------------------------");
  console.log("CREATING SONG NUMBER " + (globalIndex + 1));
  createSong();
  // console.log(videoArr.length);
}

function createSong() {
  if (globalIndex >= videoArr.length) {
    return;
  }
  var song = new Song(videoArr[globalIndex])
  song.on('ready', () => {
    globalIndex++
    next();
  })
  song.on('error', (e) => {
    globalIndex++
    next();
  })
}
