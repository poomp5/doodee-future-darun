/**
 * Minimal Path2D polyfill for node-canvas so pdfjs-dist can run on the server.
 * It records path commands and replays them into a 2D context when used.
 * Accuracy is sufficient for pdf.js rendering and avoids runtime ReferenceErrors.
 */
import { createCanvas } from "canvas";

type Command = { fn: keyof CanvasRenderingContext2D; args: any[] };

class Path2DPolyfill {
  private commands: Command[] = [];

  constructor();
  constructor(path: Path2DPolyfill);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(path?: Path2DPolyfill) {
    if (path instanceof Path2DPolyfill) {
      this.commands = [...path.commands];
    }
  }

  private add(fn: Command["fn"], ...args: any[]) {
    this.commands.push({ fn, args });
  }

  addPath(path: Path2DPolyfill) {
    if (path instanceof Path2DPolyfill) {
      this.commands.push(...path.commands);
    }
  }
  moveTo(x: number, y: number) { this.add("moveTo", x, y); }
  lineTo(x: number, y: number) { this.add("lineTo", x, y); }
  bezierCurveTo(a: number, b: number, c: number, d: number, e: number, f: number) {
    this.add("bezierCurveTo", a, b, c, d, e, f);
  }
  quadraticCurveTo(a: number, b: number, c: number, d: number) {
    this.add("quadraticCurveTo", a, b, c, d);
  }
  arc(x: number, y: number, r: number, s: number, e: number, ccw?: boolean) {
    this.add("arc", x, y, r, s, e, ccw);
  }
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number) {
    this.add("arcTo", x1, y1, x2, y2, r);
  }
  rect(x: number, y: number, w: number, h: number) { this.add("rect", x, y, w, h); }
  closePath() { this.add("closePath"); }

  applyTo(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    for (const cmd of this.commands) {
      // @ts-expect-error dynamic call
      ctx[cmd.fn]?.(...cmd.args);
    }
  }
}

export function ensurePath2D() {
  const g: any = globalThis as any;
  if (g.Path2D) return g.Path2D;

  const ctxProto = (createCanvas(1, 1).getContext("2d") as any).__proto__;
  const origFill = ctxProto.fill;
  const origStroke = ctxProto.stroke;
  const origClip = ctxProto.clip;
  const origIsPointInPath = ctxProto.isPointInPath;
  const origIsPointInStroke = ctxProto.isPointInStroke;

  function replayThen(
    this: CanvasRenderingContext2D,
    path: any,
    fallback: (...args: any[]) => any,
    ...rest: any[]
  ) {
    if (path instanceof Path2DPolyfill) {
      path.applyTo(this);
      return fallback.call(this, ...rest);
    }
    return fallback.call(this, path, ...rest);
  }

  ctxProto.fill = function(path?: any, ...rest: any[]) {
    return replayThen.call(this, path, origFill, ...rest);
  };
  ctxProto.stroke = function(path?: any, ...rest: any[]) {
    return replayThen.call(this, path, origStroke, ...rest);
  };
  ctxProto.clip = function(path?: any, ...rest: any[]) {
    if (path instanceof Path2DPolyfill) {
      // Build the path on the context, then call the native clip. Some canvas
      // bindings (e.g. @napi-rs/canvas) require the first argument to be a
      // string fill rule or a Path-like object; passing "nonzero" keeps the
      // current path and avoids type errors while matching the default rule.
      path.applyTo(this);
      const [fillRule, ...restArgs] = rest.length ? rest : ["nonzero"];
      return origClip.call(this, fillRule, ...restArgs);
    }
    return origClip.call(this, path, ...rest);
  };
  ctxProto.isPointInPath = function(path?: any, ...rest: any[]) {
    if (path instanceof Path2DPolyfill) {
      path.applyTo(this);
      return origIsPointInPath.call(this, ...rest);
    }
    return origIsPointInPath.call(this, path, ...rest);
  };
  ctxProto.isPointInStroke = function(path?: any, ...rest: any[]) {
    if (path instanceof Path2DPolyfill) {
      path.applyTo(this);
      return origIsPointInStroke.call(this, ...rest);
    }
    return origIsPointInStroke.call(this, path, ...rest);
  };

  g.Path2D = Path2DPolyfill;
  return g.Path2D;
}
