import { join } from 'path';
import { existsSync, ensureFileSync, readJsonSync, rmSync } from 'fs-extra';

import { Collection } from './Collection';
import { KenwayVars, Doc, KenwayConfig, SetOptions, ConverterOptions, ReturnMsg } from '../interfaces';
import { transformObj, KenwayIO } from '../utils';

export class Document {
  #vars: KenwayVars;

  constructor(vars: KenwayVars) {
    this.#vars = vars;
  }

  /**
   * Creates reference to provided Collection. Returns `Collection`.
   * @since v1.0.0
   */
  col(id: string): Collection {
    this.#vars.path += `${id}/`;
    return new Collection(this.#vars);
  }

  /**
   * Writes the provided `data` to the document. Returns `Promise<ReturnMsg>`.
   * @since v1.0.0
   */
  set(data: any, { merge }: SetOptions = {}): Promise<ReturnMsg> {
    const vars = this.#vars;
    const q: string[] = vars.path.slice(0, -1).split('/');
    const f: string = join(vars.dir, ...q, 'data.json');
    const fe: boolean = existsSync(f);
    ensureFileSync(f);

    if (vars.converter.active) {
      data = (function c(d: any): any {
        for (const k of Object.keys(d)) {
          if (typeof d[k] === 'object') {
            vars.converter.toKnwy((...cases: [any, any][]): any => {
              let r: any;
              cases.forEach((cs) => {
                if (d[k].constructor === cs[0]) r = cs[1](d[k]);
              });
              d[k] = r !== undefined ? { __ClassName: d[k].constructor.name, ...r } : c(d[k]);
            });
          }
        }
        return d;
      })(data);
    }

    return new Promise((resolve, reject) => {
      try {
        KenwayIO.write(f, JSON.stringify(fe && merge ? Object.assign(readJsonSync(f), data) : data));
        resolve({
          id: q[q.length - 1],
          msg: `Document <${q[q.length - 1]}> was ${
            merge ? `merged with the contents` : 'created using data provided'
          }`,
        } as ReturnMsg);
      } catch (e) {
        reject(e);
      }
    });
  }

  update(data: any): Promise<ReturnMsg> {
    const q: string[] = this.#vars.path.slice(0, -1).split('/');
    const filename: string = join(this.#vars.dir, ...q, 'data.json');
    if (existsSync(filename)) {
      return this.set(transformObj(data), { merge: true });
    } else return new Promise((resolve, reject) => reject(`Document <${q[q.length - 1]}> doesn't exist`));
  }

  get(): Promise<Doc> {
    const vars = this.#vars;
    const query: string[] = vars.path.slice(0, -1).split('/');
    return new Promise((resolve, reject) => {
      const filename: string = join(vars.dir, ...query, 'data.json');
      if (existsSync(filename)) {
        resolve({
          id: query[query.length - 1],
          exists: true,
          data: () => {
            let data = JSON.parse(KenwayIO.read(filename));
            if (vars.converter.active) {
              data = (function c(d: any): any {
                for (const k of Object.keys(d)) {
                  if (typeof d[k] === 'object') {
                    vars.converter.fromKnwy((...cases: [any, any][]): any => {
                      cases.forEach((cs) => {
                        d[k] = d[k].__ClassName === cs[0] ? cs[1](d[k]) : c(d[k]);
                      });
                    });
                  }
                }
                return d;
              })(data);
              return data;
            } else return data;
          },
        } as Doc);
      } else reject(`Document <${query[query.length - 1]}> not found`);
    });
  }

  delete(): Promise<ReturnMsg> {
    const q: string[] = this.#vars.path.slice(0, -1).split('/');
    return new Promise((resolve, reject) => {
      try {
        rmSync(join(this.#vars.dir, ...q), { recursive: true, force: true });
        resolve({
          id: q[q.length - 1],
          msg: `Document <${q[q.length - 1]}> was successfully deleted`,
        } as ReturnMsg);
      } catch (e) {
        reject(`Faled to Delete Document <${q[q.length - 1]}> : ${e}`);
      }
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
