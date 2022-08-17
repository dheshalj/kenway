import express, { RequestHandler } from 'express';
import expressWs, { Application, Router } from 'express-ws';

import { Kenway } from '..';

import { Doc } from '../interfaces';
import { Collection } from '../modules/Collection';
import { Document } from '../modules/Document';
import { genUID } from '../utils';

export class KenwayServer {
  #knwy: Kenway;
  app: Application;
  #router: Router;
  #prefix: string;
  constructor(knwy: Kenway, prefix: string) {
    this.#knwy = knwy;
    this.app = expressWs(express()).app;
    this.#router = express.Router();
    this.#prefix = prefix;
    this.app.use(express.json());
  }

  use(...handlers: RequestHandler[]) {
    this.#router.use(handlers);
  }

  init() {
    this.#router.all('*', (req, res) => {
      const newurl = new URL(req.url, `http://${req.headers.host}`);
      const path = newurl.pathname.split('/').filter((x) => x);
      if (path.length > 0) {
        this.#knwy.vars.path = `${newurl.pathname
          .split('/')
          .filter((x) => x)
          .join('/')}/`;
        if (req.method === 'GET') {
          if (path.length % 2 !== 0) {
            new Collection(this.#knwy.vars)
              .get()
              .then((docs: Doc[]) => {
                const resData = docs.map((doc) => {
                  return {
                    id: doc.id,
                    data: doc.data(),
                  };
                });
                res.status(200).send(`${JSON.stringify(resData)}`);
              })
              .catch((err) => {
                res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: ${err}`);
              });
          } else {
            new Document(this.#knwy.vars)
              .get()
              .then((doc: Doc) => {
                res.status(200).send(`${JSON.stringify((doc as Doc).data())}`);
              })
              .catch((err) => {
                res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: ${err}`);
              });
          }
        } else if (req.method === 'POST') {
          if (path.length % 2 !== 0) {
            new Collection(this.#knwy.vars)
              .doc(genUID())
              .set(req.body)
              .then((ret) => {
                res.status(200).send(`${req.method} ${newurl.pathname} Done: ${ret.msg}`);
              })
              .catch((err) => {
                res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: ${err}`);
              });
          } else {
            new Document(this.#knwy.vars)
              .set(req.body)
              .then((ret) => {
                res.status(200).send(`${req.method} ${newurl.pathname} Done: ${ret.msg}`);
              })
              .catch((err) => {
                res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: ${err}`);
              });
          }
        } else if (req.method === 'PATCH') {
          if (path.length % 2 === 0) {
            new Document(this.#knwy.vars)
              .update(req.body)
              .then((ret) => {
                res.status(200).send(`${req.method} ${newurl.pathname} Done: ${ret.msg}`);
              })
              .catch((err) => {
                res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: ${err}`);
              });
          } else {
            res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: PATCH can only be used for documents`);
          }
        } else if (req.method === 'DELETE') {
          if (path.length % 2 === 0) {
            new Document(this.#knwy.vars)
              .delete()
              .then((ret) => {
                res.status(200).send(`${req.method} ${newurl.pathname} Done: ${ret.msg}`);
              })
              .catch((err) => {
                res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: ${err}`);
              });
          } else {
            res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: PATCH can only be used for documents`);
            res.end();
          }
        }
      } else {
        res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: No query paths provided`);
      }
    });
  }

  listen(port?: number) {
    this.app.use(`/${this.#prefix}`, this.#router);
    this.app.listen(port ? port : 3030);
  }
}
