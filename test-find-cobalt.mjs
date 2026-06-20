async function findWorkingCobalt() {
  try {
    const instancesReq = await fetch('https://instances.hyper.lol/instances.json');
    const instances = await instancesReq.json();
    
    // Filter active and trusting instances
    const activeInstances = instances.filter(i => i.up && i.trust);
    
    console.log(`Found ${activeInstances.length} active trusting instances.`);
    
    // Try the first 5
    for (const inst of activeInstances.slice(0, 5)) {
      console.log(`Testing ${inst.api}...`);
      try {
        const res = await fetch(`${inst.api}/json`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
            isAudioOnly: true,
            aFormat: 'mp3'
          })
        });
        const text = await res.text();
        console.log(`Response from ${inst.api}: ${res.status}`);
        if (res.status === 200) {
          console.log(`SUCCESS! URL:`, JSON.parse(text).url);
          return;
        } else {
          console.log(`Failed. Body: ${text.substring(0, 100)}`);
        }
      } catch (e) {
        console.log(`Failed to reach ${inst.api}`);
      }
    }
  } catch (e) {
    console.log("Error fetching instances:", e);
  }
}

findWorkingCobalt();
