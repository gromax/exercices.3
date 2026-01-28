import MyMath from '@mathstools/mymath'
import { getValue  } from '../maths/misc/substitution.js'

class TextNode {
    private _text:string

    constructor(text:string) {
       this._text = text
    }

    toString():string {
       return this._text
    }

    run(params:Record<string, any>, caller:any):string|void {
        if (/^\?@([A-Za-z_]\w*)(?:\.([A-Za-z_]\w*)|\[((?:@[A-Za-z_]\w*|[0-9]+)?)\])?$/.test(this._text)) {
            // c'est un log
            const varName = this._text.slice(1);
            console.info(getValue(varName, params) ?? this._text)
        } else {
            return MyMath.substituteExpressions(this._text, params)
        }
    }

    get text():string {
        return this._text
    }
}

export default TextNode
