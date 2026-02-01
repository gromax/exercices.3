import MyMath from '@mathstools/mymath'
import { TParams } from '@types'
import { Node, TRunResult } from './node'

class TextNode extends Node {
    private _text:string
    private _closed:boolean = false

    constructor(text:string) {
        super('textnode')
        this._text = text
    }

    toString():string {
       return this._text
    }

    run(params:TParams):TextNode {
        if (!this._runned) {
            this._text = MyMath.substituteExpressions(this._text, params)
            this._runned = true
        }
        return this
    }

    get text():string {
        return this._text
    }

    close():void {
        this._closed = true
    }

    get closed():boolean {
        return this._closed
    }

    appendText(text:string) {
        if (this._closed) {
            throw new Error("On ne peut ajouter du texte à un noeud fermé.")
        }
        this._text += '\n' + text
    }

    get empty():boolean {
        return this._text === ""
    }
}

export default TextNode
