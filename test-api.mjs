import { getVideoStream } from './src/lib/api.js';

async function test() {
  const data = await getVideoStream('nPo7sJcCdJw');
  console.log("Stream URL:", data?.streamUrl);
  if (data?.streamUrl) {
    console.log("URL is valid:", data.streamUrl.startsWith("http"));
  } else {
    console.log("NO URL RETURNED!");
  }
}

test();
