import { join, dirname } from 'path';

import { Collection } from './modules/Collection';
import { KenwayVars, KenwayConfig } from './interfaces';

/**
 * Entry point of Kenway. Returns `Kenway`.
 * @since v1.0.0
 */
export class Kenway {
  #vars: KenwayVars = {
    path: '',
    dir: '',
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
    this.#vars.dir = join(dirname(module.parent?.filename as string), dir)
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
    if (converter !== undefined) {
      this.#vars.converter.active = converter;
    }
  }

  static Express() {
    return 
  }
}