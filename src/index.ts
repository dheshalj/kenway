import { join, dirname } from 'path';

import { Collection } from './modules/Collection';
import { Properties, Config } from './interfaces';
import { Jackdaw } from './server';
import { RequestHandler } from 'express';

/**
 * Entry point of Kenway. Returns `Kenway`.
 * @since v1.0.0
 */
// TODO: make var names readable
export class Kenway {
  properties: Properties = {
    path: '',
    directory: '',
    server: undefined!,
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
  constructor(dir: string) {
    this.properties.directory = join(dirname(require.main ? (require.main.filename as string) : __dirname), dir);
    this.properties.server = new Jackdaw(this, 'knwy');
  }

  /**
   * Creates reference to provided Collection. Returns `Collection`.
   * @since v1.0.0
   */
  col(id: string): Collection {
    this.properties.path = `${id}/`;
    this.properties.query = [];
    this.properties.converter = { active: false, toKnwy: () => undefined, fromKnwy: () => undefined };

    return new Collection(this.properties);
  }

  /**
   * Custom Middleware for the server.
   * @since v1.0.0
   */
  use(...handlers: RequestHandler[]) {
    this.properties.server.use(...handlers);
  }

  /**
   * Listens for incoming requests on a specified port.
   *
   * @param {number} [port] - The port number to listen on.
   */
  listen(port?: number) {
    this.properties.server.listen(port);
  }

  /**
   * Change global config of current `Kenway` instance. Returns `void`.
   * @since v1.0.0
   */
  config({ converter }: Config = {}) {
    if (converter !== undefined) {
      this.properties.converter.active = converter;
    }
  }
}
