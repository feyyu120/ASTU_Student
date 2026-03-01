// backend/src/cron/keepAlive.js   (or wherever you want to place it)

import cron from 'cron';
import https from 'https';

const job = new cron.CronJob(
  '*/14 * * * *',           // every 14 minutes
  function () {
    if (!process.env.API_URL) {
      console.warn('API_URL is not defined in environment variables – keep-alive ping skipped');
      return;
    }

    https
      .get(process.env.API_URL, (res) => {
        if (res.statusCode === 200) {
          console.log(`Keep-alive GET successful: ${process.env.API_URL} (status ${res.statusCode})`);
        } else {
          console.warn(`Keep-alive GET failed: ${process.env.API_URL} (status ${res.statusCode})`);
        }
      })
      .on('error', (err) => {
        console.error(`Keep-alive request error for ${process.env.API_URL}:`, err.message);
      });
  },
  null,                        // onComplete (optional – usually null)
  true,                        // start the job right away
  'Africa/Addis_Ababa'         // timezone – good for you in Ethiopia (EAT)
);

console.log(`Keep-alive cron job started – pinging ${process.env.API_URL} every 14 minutes`);

// Optional: graceful shutdown (good practice on Render)
process.on('SIGTERM', () => {
  console.log('SIGTERM received – stopping keep-alive cron job');
  job.stop();
});

export default job;