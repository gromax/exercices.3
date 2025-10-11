import { substituteLabels, substituteLatex } from './misc.js';

class TextNode {
  constructor(text) {
    this._text = text;
  }

  toString() {
    return this._text;
  }

  run(params, options) {
    const text = substituteLabels(this._text, {...params, ...options});
    return substituteLatex(text);
  }

  get text() {
    return this._text;
  }
}

export default TextNode;
