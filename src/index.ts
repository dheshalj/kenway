import { join, dirname } from 'path';

import { Collection } from './modules/Collection';
import { KenwayVars, KenwayConfig } from './interfaces';
import { KenwayServer } from './server';
import { RequestHandler } from 'express';

/**
 * Entry point of Kenway. Returns `Kenway`.
 * @since v1.0.0
 */
export class Kenway {
  #vars: KenwayVars = {
    path: '',
    dir: '',
    srv: undefined!,
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
  constructor({ dir, port }: { dir: string, port?: number }) {
    this.#vars.dir = join(dirname(require.main ? require.main.filename as string : __dirname), dir)
    this.#vars.srv = new KenwayServer(this, 'knwy', port)
    this.#vars.srv.init()
  }

  /**
   * Get `Express.Application` of default `KenwayServer`.
   * @since v1.3.2
   */
  get srv() {
    return this.#vars.srv.app
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
   * Custom Middleware for the server.
   * @since v1.0.0
   */
  use(...handlers: RequestHandler[]) {
    this.#vars.srv.use(...handlers)
  }

  /**
   * Change global config of current `Kenway` instance. Returns `void`.
   * @since v1.0.0
   */
  config({ converter }: KenwayConfig = {}) {
    if (converter !== undefined) {
      this.#vars.converter.active = converter;
    }
  }
}