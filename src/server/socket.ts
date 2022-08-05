import WebSocket = require('ws');

export class KenwaySocket {
  wss;
  constructor(wss: WebSocket.Server) {
    this.wss = wss
  }

  on(event: string, cb: (data: any) => void) {
    this.wss.on('connection', (ws) => {
      ws.on('message', (data: any) => {
        try {
          const json = JSON.parse(data.toString())
          if (json.event === event) cb(json.data)
        } catch (e: any) {
          // console.error(e.message)
        }
      });
    })
  }

  emit(event: string, data: any) {
    this.wss.clients.forEach((ws) => {
      ws.send(JSON.stringify({ event, data }))
    });
  }

  init() {
    this.on('watch', (data: { path: string, listen: boolean }) => {
      // console.log('watch')
    })
  }
}