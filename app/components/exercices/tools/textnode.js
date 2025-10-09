import Parent from './parent.js';

class TextNode {
  constructor(text) {
    this._text = text;
  }

  toString() {
    return this._text;
  }

  run(params, options) {
    return Parent.substituteLabels(this._text, {...params, ...options});
  }

  get text() {
    return this._text;
  }
}

export default TextNode;
