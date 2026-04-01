import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/passes');
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text.substring(0, 100));
}

test();