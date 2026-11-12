// MetaGreenWave Lightweight Standalone Health Check Probe
const http = require('http');

const options = {
  host: process.env.HOST || '127.0.0.1',
  port: process.env.PORT || 5000,
  path: '/api/v1/health',
  timeout: 4000,
  method: 'GET',
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        if (json.status === 'ok') {
          process.exit(0);
        } else {
          console.error(`Unhealthy status: ${json.status}`);
          process.exit(1);
        }
      } catch (e) {
        process.exit(0);
      }
    });
  } else {
    console.error(`Healthcheck failed with status code ${res.statusCode}`);
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error(`Healthcheck request error: ${err.message}`);
  process.exit(1);
});

request.end();

