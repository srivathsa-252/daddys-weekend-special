import xss from "xss";

export function sanitize(input: string): string {
  return xss(input, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ["script"] });
}
