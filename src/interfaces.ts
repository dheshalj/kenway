import { KenwayServer } from "./server";

export interface KenwayVars {
  dir: string;
  srv: KenwayServer;
  path: string;
  query: [key: string, op: string, value: string | number | boolean][];
  converter: ConverterOptions & { active: boolean };
}

export interface KenwayConfig {
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
  toKnwy: (switcher: (...cases: [any, any][]) => any) => any;
  fromKnwy: (switcher: (...cases: [any, any][]) => any) => any;
}
