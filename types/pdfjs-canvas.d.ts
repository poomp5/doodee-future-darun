declare module "pdfjs-dist" {
  export interface RenderParameters {
    canvasContext: import("canvas").CanvasRenderingContext2D;
    canvas: import("canvas").Canvas;
    viewport: any;
  }

    export function getDocument(arg0: { data: Buffer<ArrayBufferLike>; }) {
        throw new Error("Function not implemented.");
    }
}
