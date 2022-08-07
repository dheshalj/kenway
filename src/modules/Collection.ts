import { join } from 'path';
import { existsSync, readdirSync } from 'fs-extra';

import { Document } from './Document';
import { ConverterOptions, Doc, ReturnMsg, KenwayConfig, KenwayVars } from '../interfaces';
import { genUID, KenwayIO } from '../utils';

export class Collection {
  #vars: KenwayVars;

  constructor(vars: KenwayVars) {
    this.#vars = vars;
  }

  doc(id: string): Document {
    this.#vars.path += `${id}/`;
    return new Document(this.#vars);
  }

  add(data: any): Promise<ReturnMsg> {
    return this.doc(genUID()).set(data);
  }
  
  get(): Promise<Doc[]> {
    return this.#get(this.#vars);
  }

  where(key: string, op: string, value: string | number | boolean) {
    this.#vars.query.push([key, op, value]);
    return {
      get: () => this.#get(this.#vars),
      where: (k: string, o: string, v: string | number | boolean) => this.#where(k, o, v, this.#vars),
    };
  }

  #where(key: string, op: string, value: string | number | boolean, vars: KenwayVars) {
    vars.query.push([key, op, value]);
    return {
      get: () => this.#get(vars),
      where: (k: string, o: string, v: string | number | boolean) => this.#where(k, o, v, vars),
    };
  }

  #get(vars: KenwayVars): Promise<Doc[]> {
    return new Promise((resolve, reject) => {
      const folderpath: string = join(vars.dir, ...vars.path.slice(0, -1).split('/'));
      if (existsSync(folderpath)) {
        resolve(
          readdirSync(folderpath, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .filter((d) => {
              if (vars.query === undefined || vars.query.length === 0) return true;
              const data: any = JSON.parse(KenwayIO.read(join(folderpath, d.name, 'data.json')));
              let returnVal = false;
              vars.query.forEach((q) => {
                returnVal =
                  {
                    '==': q[0].split('.').reduce((a: any, c: any) => a[c], data) === q[2],
                  }[q[1]] ?? false;
              });
              return returnVal;
            })
            .map((d) => {
              return {
                id: d.name,
                exists: true,
                data: () => {
                  const json = JSON.parse(KenwayIO.read(join(folderpath, d.name, 'data.json')));
                  if (vars.converter.active) {
                    return vars.converter.fromKnwy(json);
                  } else return json;
                },
              };
            }) as Doc[],
        );
      } else reject('Document not found');
    });
  }

  config({ converter }: KenwayConfig = {}) {
    if (converter !== undefined) {
      this.#vars.converter.active = converter;
    }
  }

  withConvertor({ toKnwy, fromKnwy }: ConverterOptions) {
    this.#vars.converter = { active: true, toKnwy, fromKnwy };
    return this;
  }
}
