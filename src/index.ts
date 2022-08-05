/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Server, IncomingMessage, ServerResponse } from 'http';
import { join, dirname } from 'path';
import WebSocket = require('ws');

import { Collection } from './modules/Collection';
import { KenwayVars, KenwayConfig } from './interfaces';
import { KenwayServer, KenwaySocket } from './server';

/**
 * Entry point of Kenway. Returns `Kenway`.
 * @since v1.0.0
 */
export class Kenway {
  #vars: KenwayVars = {
    path: '',
    dir: '',
    srv: undefined!,
    soc: undefined!,
    query: [],
    converter: {
      active: false,
      toKnwy: () => undefined,
      fromKnwy: () => undefined,
    },
  };

  /**
   * Creates a new `Kenway` instance. Returns `Kenway`.
   * @since v1.0.0
   */
  constructor({ dir, srv }: { dir: string, srv: Server }) {
    this.#vars.dir = join(dirname(module.parent?.filename as string), dir)
    this.#vars.srv = srv
    this.#vars.srv.on('request', (req: IncomingMessage, res: ServerResponse) => {
      const server = new KenwayServer(this.#vars, req, res, 'knwy')
      server.init()
    })
    this.#vars.soc = new KenwaySocket(new WebSocket.Server({ server: srv }))
    this.#vars.soc.init()
  }

  /**
   * Creates reference to provided Collection. Returns `Collection`.
   * @since v1.0.0
   */
  col(id: string): Collection {
    this.#vars.path = `${id}/`;
    this.#vars.query = [];
    this.#vars.converter = { active: false, toKnwy: () => undefined, fromKnwy: () => undefined };

    return new Collection(this.#vars);
  }

  /**
   * Change global config of current `Kenway` instance. Returns `void`.
   * @since v1.0.0
   */
  config({ converter }: KenwayConfig = {}) {
    if (converter) {
      this.#vars.converter.active = converter;
    }
  }
}