import { Innertube } from 'youtubei.js';

async function testCors() {
  const yt = await Innertube.create();
  const info = await yt.getInfo('dQw4w9WgXcQ', { client: 'IOS' });
  const format = info.chooseFormat({ type: 'audio', quality: 'best' });
  const url = await format.decipher(yt.session.player);
  
  const res = await fetch(url, { method: 'OPTIONS', headers: {
    'Origin': 'http://localhost:3000'
  }});
  
  console.log("CORS headers:");
  res.headers.forEach((v, k) => console.log(`${k}: ${v}`));
}

testCors();
