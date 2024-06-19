import express, { RequestHandler } from 'express';
import expressWs, { Application, Router } from 'express-ws';

import { Kenway } from '..';
import { Doc } from '../interfaces';
import { Collection } from '../modules/Collection';
import { Document } from '../modules/Document';
import { genUID } from '../utils';

export class Jackdaw {
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

    this.init();
  }

  use(...handlers: RequestHandler[]) {
    this.#router.use(handlers);
  }

  init() {
    this.#router.all('*', async (req, res) => {
      const newurl = new URL(req.url, `http://${req.headers.host}`);
      const path = newurl.pathname.split('/').filter(Boolean);

      if (path.length <= 0) {
        res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: No query paths provided`);
        return;
      }

      this.#knwy.properties.path = `${newurl.pathname.split('/').filter(Boolean).join('/')}/`;

      try {
        if (req.method === 'GET') {
          const docs = path.length % 2 !== 0 ? await new Collection(this.#knwy.properties).get() : await new Document(this.#knwy.properties).get();
          // const responseData = docs.map((doc: Doc) => ({ id: doc.id, data: doc.data() }));
          res.status(200).send(JSON.stringify(docs));
        } else if (req.method === 'POST') {
          const target = path.length % 2 !== 0 ? new Collection(this.#knwy.properties).doc(genUID()) : new Document(this.#knwy.properties);
          const ret = await target.set(req.body);
          res.status(200).send(`${req.method} ${newurl.pathname} Done: ${ret.msg}`);
        } else if (req.method === 'PATCH') {
          if (path.length % 2 === 0) {
            const ret = await new Document(this.#knwy.properties).update(req.body);
            res.status(200).send(`${req.method} ${newurl.pathname} Done: ${ret.msg}`);
          } else {
            res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: PATCH can only be used for documents`);
          }
        } else if (req.method === 'DELETE') {
          if (path.length % 2 === 0) {
            const ret = await new Document(this.#knwy.properties).delete();
            res.status(200).send(`${req.method} ${newurl.pathname} Done: ${ret.msg}`);
          } else {
            res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: PATCH can only be used for documents`);
          }
        }
      } catch (err) {
        res.status(200).send(`${req.method} ${newurl.pathname} Failed Error: ${err}`);
      }
    });
  }

  listen(port?: number) {
    this.app.use(`/${this.#prefix}`, this.#router);
    this.app.listen(port ?? 3030);
  }
}
