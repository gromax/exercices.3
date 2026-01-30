import MyMath from '@mathstools/mymath'
import { TParams } from '@types'
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

    run(params:TParams, caller:any):TextNode|null {
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
