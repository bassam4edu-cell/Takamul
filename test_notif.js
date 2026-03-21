const fetch = require('node-fetch');
fetch('http://localhost:3000/api/notifications?userId=1')
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
