import { join } from 'path';
import { existsSync, readdirSync } from 'fs-extra';

import { Document } from './Document';
import { genUID, KenwayIO } from '../utils';
import { Doc, Config, Properties, ReturnMsg, ConverterOptions } from '../interfaces';

export class Collection {
  #properties: Properties;

  constructor(properties: Properties) {
    this.#properties = properties;
  }

  doc(id: string): Document {
    const docProperties = { ...this.#properties, path: `${this.#properties.path}${id}/` };
    return new Document(docProperties);
  }

  async add(data: any): Promise<ReturnMsg> {
    return this.doc(genUID()).set(data);
  }

  get(): Promise<Doc[]> {
    return this.#get(this.#properties);
  }

  where(key: string, op: string, value: string | number | boolean) {
    this.#properties.query.push([key, op, value]);
    return {
      get: () => this.#get(this.#properties),
      where: (k: string, o: string, v: string | number | boolean) => this.where(k, o, v),
    };
  }

  async #get(vars: Properties): Promise<Doc[]> {
    const folderPath = join(vars.directory, ...vars.path.slice(0, -1));

    if (!existsSync(folderPath)) {
      throw new Error(`Collection <${vars.path[vars.path.length - 2]}> not found`);
    }

    try {
      const dirents = readdirSync(folderPath, { withFileTypes: true });
      return this.#filterAndMapDocs(dirents, vars.query, folderPath, vars.converter);
    } catch (err) {
      throw new Error(`Error reading directory: ${err}`);
    }
  }

  #filterAndMapDocs(dirents: any[], query: any[], folderPath: string, converter?: ConverterOptions): Doc[] {
    return dirents
      .filter((dirent) => dirent.isDirectory())
      .filter((dirent) => this.#filterByQuery(dirent, query, folderPath))
      .map((dirent) => this.#mapToDoc(dirent, folderPath, converter));
  }

  #filterByQuery(dirent: any, query: any[], folderPath: string): boolean {
    if (!query || query.length === 0) return true;

    const dataPath = join(folderPath, dirent.name, 'data.json');
    if (!existsSync(dataPath)) return false;

    const data = JSON.parse(KenwayIO.read(dataPath));
    return query.every(([key, op, value]) => this.#applyQueryOperation(data, key, op, value));
  }

  #applyQueryOperation(data: any, key: string, op: string, value: any): boolean {
    const actualValue = key.split('.').reduce((obj, prop) => obj[prop], data);
    switch (op) {
      case '==':
        return actualValue === value;
      // Add other operations here if needed
      default:
        return false;
    }
  }

  #mapToDoc(dirent: any, folderPath: string, converter?: ConverterOptions): Doc {
    const dataPath = join(folderPath, dirent.name, 'data.json');
    const id = dirent.name;
    const exists = true;
    const data = () => {
      const jsonData = JSON.parse(KenwayIO.read(dataPath));
      return converter && converter.active ? converter.fromKnwy(jsonData) : jsonData;
    };
    return { id, exists, data };
  }

  config({ converter }: Config = {}) {
    if (converter !== undefined) {
      this.#properties.converter.active = converter;
    }
  }

  withConverter({ toKnwy, fromKnwy }: ConverterOptions) {
    this.#properties.converter = { active: true, toKnwy, fromKnwy };
    return this;
  }
}
