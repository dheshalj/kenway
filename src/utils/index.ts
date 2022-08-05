export { KenwayIO } from './io'

export const genUID = () => {
  let d = new Date().getTime();
  let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
  return 'xxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
    // tslint:disable-next-line:no-bitwise
    const r = d > 0 ? (d + Math.random() * 16) % 16 | 0 : (d2 + Math.random() * 16) % 16 | 0;
    d > 0 ? (d = Math.floor(d / 16)) : (d2 = Math.floor(d2 / 16));
    return r.toString(16);
  });
};

export const transformObj = (obj: any) => {
  return Object.keys(obj).reduce((acc: any, key: string) => {
    if (key.indexOf('.') >= 0) {
      const [parentKey, childKey] = key.split('.');
      acc[parentKey] = acc[parentKey] || {};
      acc[parentKey][childKey] = obj[key];
    } else acc[key] = obj[key];
    return acc;
  }, {});
};