import express, { RequestHandler } from 'express';
import expressWs, { Application, Router } from 'express-ws';

import { Kenway } from '..';

import { Doc } from '../interfaces';
import { genUID } from '../utils';

export class KenwayServer {
  #knwy: Kenway;
  app: Application;
  #router: Router;
  #prefix: string;
  constructor(knwy: Kenway, prefix: string) {
    this.#knwy = knwy;
    this.app = expressWs(express()).app;
    this.#router = express.Router()
    this.#prefix = prefix;
    this.app.use(express.json());
  }

  use(...handlers: RequestHandler[]) {
    this.#router.use(handlers);
  }

  init() {
    // GET
    this.#router.get(`/:col`, (req, res) => {
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
    this.#router.get(`/:col/:doc`, (req, res) => {
      this.#knwy
        .col(req.params.col)
        .doc(req.params.doc)
        .get()
        .then((doc: Doc) => {
          res.status(200).jsonp((doc as Doc).data());
        })
        .catch((err) => {
          res.status(200).send(`${req.method} ${req.originalUrl} Failed Error: ${err.message}`);
        });
    });

    // POST
    this.#router.post(`/:col`, (req, res) => {
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
    this.#router.post(`/:col/:doc`, (req, res) => {
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
    this.#router.patch(`/:col/:doc`, (req, res) => {
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
    this.#router.delete(`/:col/:doc`, (req, res) => {
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
  }

  listen(port?: number) {
    this.app.use(`/${this.#prefix}`, this.#router)
    this.app.listen(port ? port : 3030);
  }
}
