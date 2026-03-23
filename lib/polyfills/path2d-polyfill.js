// Minimal shim for pdfjs-dist legacy build; node-canvas already provides Path2D.
module.exports = {
  polyfillPath2D: function noop() {
    return;
  },
};
