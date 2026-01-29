import MyMath from '@mathstools/mymath'
import { InputType } from '@mathstools/misc/check'
import Node from './node'

class TextNode extends Node {
    private _text:string

    constructor(text:string) {
        super('text')
        this._text = text
    }

    toString():string {
       return this._text
    }

    run(params:Record<string, InputType>, caller:any):TextNode|null {
        if (!this._runned) {
            this._text = MyMath.substituteExpressions(this._text, params)
            this._runned = true
        }
        return this
    }

    get text():string {
        return this._text
    }

    appendText(text:string) {
        this._text += '\n' + text
    }
}

export default TextNode
