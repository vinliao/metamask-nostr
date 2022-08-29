// const WebSocket = require('ws');
import webSocket from 'ws';

export async function POST({ request }) {
  const rawBody = await request.text();
  let body = JSON.parse(rawBody);
  body.content = JSON.stringify(body.content);

  const ws = new webSocket('wss://nostr-pub.wellorder.net');

  console.log(JSON.stringify(["EVENT", body]));

  ws.onopen = () => ws.send(JSON.stringify(["EVENT", body]));
  ws.onmessage = (msg: string) => {
    console.log(msg);
  };

  return { status: 200 };
}