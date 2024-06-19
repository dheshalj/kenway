import { join } from 'path';
import { existsSync, ensureFileSync, readJsonSync, rmSync } from 'fs-extra';

import { Collection } from './Collection';
import { Properties, Doc, Config, SetOptions, ConverterOptions, ReturnMsg } from '../interfaces';
import { transformObj, KenwayIO } from '../utils';

export class Document {
  #vars: Properties;

  constructor(vars: Properties) {
    this.#vars = vars;
  }

  col(id: string): Collection {
    const updatedVars = { ...this.#vars, path: `${this.#vars.path}${id}/` };
    return new Collection(updatedVars);
  }

  async set(data: any, { merge }: SetOptions = {}): Promise<ReturnMsg> {
    const q = this.#vars.path.split('/').filter(Boolean);
    const filePath = join(this.#vars.directory, ...q, 'data.json');
    const fileExists = existsSync(filePath);
    ensureFileSync(filePath);

    if (this.#vars.converter.active) {
      data = this.#convertData(data, this.#vars.converter.toKnwy);
    }

    try {
      KenwayIO.write(filePath, JSON.stringify(fileExists && merge ? { ...readJsonSync(filePath), ...data } : data));
      return {
        id: q[q.length - 1],
        msg: `Document <${q[q.length - 1]}> was ${merge ? 'merged with the contents' : 'created using data provided'}`,
      };
    } catch (error) {
      throw new Error(error as string);
    }
  }

  async update(data: any): Promise<ReturnMsg> {
    const q = this.#vars.path.split('/').filter(Boolean);
    const filePath = join(this.#vars.directory, ...q, 'data.json');

    if (existsSync(filePath)) {
      return this.set(transformObj(data), { merge: true });
    } else {
      throw new Error(`Document <${q[q.length - 1]}> doesn't exist`);
    }
  }

  async get(): Promise<Doc> {
    const q = this.#vars.path.split('/').filter(Boolean);
    const filePath = join(this.#vars.directory, ...q, 'data.json');

    if (existsSync(filePath)) {
      return {
        id: q[q.length - 1],
        exists: true,
        data: () => {
          let data = JSON.parse(KenwayIO.read(filePath));
          if (this.#vars.converter.active) {
            data = this.#convertData(data, this.#vars.converter.fromKnwy);
          }
          return data;
        },
      };
    } else {
      throw new Error(`Document <${q[q.length - 1]}> not found`);
    }
  }

  async delete(): Promise<ReturnMsg> {
    const q = this.#vars.path.split('/').filter(Boolean);
    const filePath = join(this.#vars.directory, ...q);

    try {
      rmSync(filePath, { recursive: true, force: true });
      return {
        id: q[q.length - 1],
        msg: `Document <${q[q.length - 1]}> was successfully deleted`,
      };
    } catch (error) {
      throw new Error(`Failed to delete Document <${q[q.length - 1]}> : ${error}`);
    }
  }

  config({ converter }: Config = {}) {
    if (converter !== undefined) {
      this.#vars.converter.active = converter;
    }
  }

  withConverter({ toKnwy, fromKnwy }: ConverterOptions) {
    this.#vars.converter = { active: true, toKnwy, fromKnwy };
    return this;
  }

  #convertData(data: any, convertFunction: Function): any {
    const convertedData = convertFunction(data);
    if (typeof convertedData !== 'undefined') {
      return convertedData;
    } else {
      return data;
    }
  }
}
