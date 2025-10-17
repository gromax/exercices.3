import { substituteExpressions, substituteLabels } from './misc.js';

class TextNode {
  constructor(text) {
    this._text = text;
  }

  toString() {
    return this._text;
  }

  run(params, caller) {
    const text = substituteExpressions(this._text, params);
    return substituteLabels(text, params);
  }

  get text() {
    return this._text;
  }
}

export default TextNode;
