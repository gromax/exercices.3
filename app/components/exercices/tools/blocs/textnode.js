import MyNerd from '../maths/mynerd.js';
import { getValue  } from '../maths/misc/substitution.js';

class TextNode {
  constructor(text) {
    this._text = text;
  }

  toString() {
    return this._text;
  }

  run(params, caller) {
    if (/^\?@([A-Za-z_]\w*)(?:\.([A-Za-z_]\w*)|\[((?:@[A-Za-z_]\w*|[0-9]+)?)\])?$/.test(this._text)) {
      // c'est un log
      const varName = this._text.slice(1);
      console.info(getValue(varName, params) ?? this._text);
    } else {
      return this._substituteExpressions(this._text, params);
    }
  }

  get text() {
    return this._text;
  }
  
  /**
   * remplace les expressions de la forme {expression:format}
   * par la valeur évaluée de l'expression au format spécifié
   */
  _substituteExpressions(str, params) {
      return str.replace(/\{([^:]+):\s*([\w]*(?:\$)?)?\}/g, (match, expr, format) => {
          return MyNerd.make(expr, params).toFormat(format);
      });
  }
}

export default TextNode;
