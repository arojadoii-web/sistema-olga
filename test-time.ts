import axios from 'axios';

async function checkDate() {
  const urls = [
    'https://timeapi.io/api/Time/current/zone?timeZone=America/Lima',
    'https://httpbin.org/date',
    'https://api.github.com'
  ];

  for (const url of urls) {
    try {
      console.log(`Querying ${url}...`);
      const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.headers.date) {
        console.log(`-> Header date:`, res.headers.date);
      }
      if (res.data) {
        console.log(`-> Data snippet:`, JSON.stringify(res.data).substring(0, 200));
      }
    } catch (e: any) {
      console.log(`-> Failed: ${e.message}`);
    }
  }
}
checkDate();
