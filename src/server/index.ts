import express, { RequestHandler } from 'express';
import expressWs, { Application } from 'express-ws';

import { Kenway } from '..';

import { Doc } from '../interfaces';
import { genUID } from '../utils';

export class KenwayServer {
  #knwy: Kenway;
  #app: Application;
  #prefix?: string;
  #port?: number;
  constructor(knwy: Kenway, prefix?: string, port?: number) {
    this.#knwy = knwy;
    this.#app = expressWs(express()).app;
    this.#prefix = prefix;
    this.#port = port ? port : 3030;
  }

  use(...handlers: RequestHandler[]) {
    this.#app.use(handlers);
  }

  init() {
    this.#app.use(express.json());

    const prefix = this.#prefix ? `/${this.#prefix}` : '';

    // GET
    this.#app.get(`${prefix}/:col`, (req, res) => {
      this.#knwy
        .col(req.params.col)
        .get()
        .then((docs: Doc[]) => {
          const resData = docs.map((doc) => {
            return {
              id: doc.id,
              data: doc.data(),
            };
          });
          res.status(200).jsonp(resData);
        })
        .catch((err) => {
          res.status(200).send(`${req.method} ${req.originalUrl} Failed Error: ${err.message}`);
        });
    });
    this.#app.get(`${prefix}/:col/:doc`, (req, res) => {
      this.#knwy
        .col(req.params.col)
        .doc(req.params.doc)
        .get()
        .then((doc: Doc) => {
          res.status(200).jsonp(JSON.stringify((doc as Doc).data()));
        })
        .catch((err) => {
          res.status(200).send(`${req.method} ${req.originalUrl} Failed Error: ${err.message}`);
        });
    });

    // POST
    this.#app.post(`${prefix}/:col`, (req, res) => {
      this.#knwy
        .col(req.params.col)
        .doc(genUID())
        .set(req.body)
        .then((ret) => {
          res.status(200).send(`${req.method} ${req.originalUrl} Done: ${ret.msg}`);
        })
        .catch((err) => {
          res.status(200).send(`${req.method} ${req.originalUrl} Failed Error: ${err.message}`);
        });
    });
    this.#app.post(`${prefix}/:col/:doc`, (req, res) => {
      this.#knwy
        .col(req.params.col)
        .doc(req.params.doc)
        .set(req.body)
        .then((ret) => {
          res.status(200).send(`${req.method} ${req.originalUrl} Done: ${ret.msg}`);
        })
        .catch((err) => {
          res.status(200).send(`${req.method} ${req.originalUrl} Failed Error: ${err.message}`);
        });
    });

    // PATCH
    this.#app.patch(`${prefix}/:col/:doc`, (req, res) => {
      this.#knwy
        .col(req.params.col)
        .doc(req.params.doc)
        .update(req.body)
        .then((ret) => {
          res.status(200).send(`${req.method} ${req.originalUrl} Done: ${ret.msg}`);
        })
        .catch((err) => {
          res.status(200).send(`${req.method} ${req.originalUrl} Failed Error: ${err.message}`);
        });
    });

    // DELETE
    this.#app.delete(`${prefix}/:col/:doc`, (req, res) => {
      this.#knwy
        .col(req.params.col)
        .doc(req.params.doc)
        .delete()
        .then((ret) => {
          res.status(200).send(`${req.method} ${req.originalUrl} Done: ${ret.msg}`);
        })
        .catch((err) => {
          res.status(200).send(`${req.method} ${req.originalUrl} Failed Error: ${err.message}`);
        });
    });

    this.#app.listen(this.#port, () => {
      // console.log(`Kenway DB listening on port ${this.#port}`);
    });
  }
}
