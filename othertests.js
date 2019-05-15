const https = require('https');
const fs = require('fs');

options = {
  hostname: 'www.youtube.com',
  port: 443,
  path: '/watch?v=UOxkGD8qRB4',
  headers: {
    userAgent: ''
  }
}

https.get(options, (res)=>{
  var rawData = '';
  res.on('data', (chunk) => {rawData += chunk})
  res.on('end', () => {
    fs.appendFile('prova.html', rawData, ()=>{console.log("saved");})
  })
})
