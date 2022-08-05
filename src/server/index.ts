import { IncomingMessage, ServerResponse } from 'http';
import { Doc, KenwayVars } from '../interfaces';
import { Collection } from '../modules/Collection';
import { Document } from '../modules/Document';
import { genUID } from '../utils';

export * from './socket'

export class KenwayServer {
  #vars: KenwayVars
  #url: URL
  #req: IncomingMessage
  #res: ServerResponse
  #prefix: string
  constructor(vars: KenwayVars, req: IncomingMessage, res: ServerResponse, prefix: string) {
    this.#vars = vars
    this.#req = req
    this.#res = res
    this.#url = new URL(req.url as string, `http://${req.headers.host}`)
    this.#prefix = prefix
  }

  get isNotKnwyPath(): boolean {
    return (this.#url.pathname.replace(`/${this.#prefix}/`, '') === this.#url.pathname)
  }

  init() {
    if (this.isNotKnwyPath) {
      this.#res.writeHead(200).write('Bye Here :-: ')
      this.#res.end()
      return;
    };

    const path = this.#url.pathname.replace(`/${this.#prefix}/`, '').split('/')
    if (path.length > 0) {
      this.#vars.path = `${this.#url.pathname.replace(`/${this.#prefix}/`, '')}/`

      if (this.#req.method === 'GET') {
        if (path.length % 2 !== 0) {
          new Collection(this.#vars).get().then((docs: Doc[]) => {
            const resData = docs.map((doc) => {
                return {
                  id: doc.id,
                  data: doc.data()
                }
            })
            this.#res.writeHead(200).write(`${JSON.stringify(resData)}`)
            this.#res.end()
          }).catch((err) => {
            this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Failed Error: ', err.message)
            this.#res.end()
          })
        } else {
          new Document(this.#vars).get().then((doc: Doc) => {
            this.#res.writeHead(200).write(`${JSON.stringify((doc as Doc).data())}`)
            this.#res.end()
          }).catch((err) => {
            this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Failed Error: ', err.message)
            this.#res.end()
          })
        }
      } else if (this.#req.method === 'POST') {
        if (path.length % 2 !== 0) {
          let body = '';
          this.#req.on('data', (chunk) => { body += chunk; });
          this.#req.on('end', () => {
            new Collection(this.#vars).doc(genUID()).set(JSON.parse(body)).then((ret) => {
              this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Done: ' + ret.msg)
              this.#res.end()
            }).catch((err) => {
              this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Failed Error: ', err.message)
              this.#res.end()
            })
          });
        } else {
          let body = '';
          this.#req.on('data', (chunk) => { body += chunk; });
          this.#req.on('end', () => {
            new Document(this.#vars).set(JSON.parse(body)).then((ret) => {
              this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Done: ' + ret.msg)
              this.#res.end()
            }).catch((err) => {
              this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Failed Error: ', err.message)
              this.#res.end()
            })
          });
        }
      } else if (this.#req.method === 'PATCH') {
        if (path.length % 2 === 0) {
          let body = '';
          this.#req.on('data', (chunk) => { body += chunk; });
          this.#req.on('end', () => {
            new Document(this.#vars).update(JSON.parse(body)).then((ret) => {
              this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Done: ' + ret.msg)
              this.#res.end()
            }).catch((err) => {
              this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Failed Error: ', err.message)
              this.#res.end()
            })
          });
        } else {
          this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Failed Error: PATCH can only be used for documents that have already been created')
          this.#res.end()
        }
      } else if (this.#req.method === 'DELETE') {
        if (path.length % 2 === 0) {
          let body = '';
          this.#req.on('data', (chunk) => { body += chunk; });
          this.#req.on('end', () => {
            new Document(this.#vars).delete().then((ret) => {
              this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Done: ' + ret.msg)
              this.#res.end()
            }).catch((err) => {
              this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Failed Error: ', err.message)
              this.#res.end()
            })
          });
        } else {
          this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Failed Error: PATCH can only be used for documents that have already been created')
          this.#res.end()
        }
      }
    } else {
      this.#res.writeHead(200).write(this.#req.method + ' ' + this.#url.pathname + ' Failed Error: no query paths provided')
      this.#res.end()
    }
  }
}