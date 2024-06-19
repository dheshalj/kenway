import { Jackdaw } from './server';

export interface Properties {
  directory: string;
  server: Jackdaw;
  path: string;
  query: [key: string, op: string, value: string | number | boolean][];
  converter: ConverterOptions & { active: boolean };
}

export interface Config {
  converter?: boolean;
}

export interface Doc {
  id?: string;
  exists: boolean;
  data: () => any;
}

export interface SetOptions {
  merge?: boolean;
}

export interface ReturnMsg {
  id: string;
  msg: string;
}

export interface ConverterOptions {
  active: boolean;
  toKnwy: (switcher: (...cases: [any, any][]) => any) => any;
  fromKnwy: (switcher: (...cases: [any, any][]) => any) => any;
}
