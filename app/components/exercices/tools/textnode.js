import BlocParent from './blocparent.js';

class TextNode {
  constructor(text) {
    this._text = text;
  }

  toString() {
    return `<TextNode>${this._text}</TextNode>`;
  }

  run(params, options) {
    return BlocParent.substituteLabels(this._text, {...params, ...options});
  }

  get text() {
    return this._text;
  }
}

export default TextNode;
