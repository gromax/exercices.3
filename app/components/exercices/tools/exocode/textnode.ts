import _ from "underscore"
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
            this._reformat()
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

    private _reformat():void {
        this._text = _.escape(this._text)
        // on va reconnaître des schémas à mettre en forme
        this._text = this._text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        this._text = this._text.replace(/__(.+?)__/g, '<i>$1</i>')
        this._text = this._text.replace(
            /::([a-z]+)::/g,
            (_match, tag) => this._pictos(tag)
        )
    }

    /**
     * un tag type 'warning' ou 'info' pour ajouter des pictogrammes correspondants.
     * @param tag l'étiquete
     * @returns le code HTML du pictogramme correspondant au tag.
     */
    private _pictos(tag:string):string {
        switch (tag) {
            case 'warning':
                return '<i class="fa-solid fa-triangle-exclamation"></i>'
            case 'info':
                return '<i class="fa-solid fa-circle-info"></i>'
            case 'heart':
                return '<i class="fa-solid fa-heart"></i>'
            case 'exclamation':
                return '<i class="fa-solid fa-circle-exclamation"></i>'
            case 'note':
                return '<i class="fa-solid fa-sticky-note"></i>'
            case 'calc':
                return '<i class="fa-solid fa-calculator"></i>'
            default:
                return `${tag}??`
        }
    }
}

export default TextNode
