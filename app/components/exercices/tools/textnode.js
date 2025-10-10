import { substituteLabels } from './misc.js';

class TextNode {
  constructor(text) {
    this._text = text;
  }

  toString() {
    return this._text;
  }

  run(params, options) {
    this._text = substituteLabels(this._text, {...params, ...options});
    return this;
  }

  get text() {
    return this._text;
  }
}

export default TextNode;
