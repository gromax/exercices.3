/**
 * L'objectif de cette classe est de gérer des blocs
 * de rendu identifiés par une balise de type <tag param1 param2 ...>
 */

import _ from 'underscore'
import { Node } from '../node'

abstract class Bloc extends Node {
    protected _children:Array<Node>
    protected _closed:boolean = false

    constructor(tag:string) {
        super(tag)
        this._children = []
    }

    get children():Array<Node> {
        return this._children.filter(item => !item.empty)
    }

    close():void {
        this._closed = true
    }

    get closed():boolean {
        return this._closed
    }

    push(child:Node):void {
        if (this.closed) {
            throw new Error("Impossible d'ajouter un enfant à un bloc fermé")
        }
        this._children.push(child)
    }

    toString():string {
        let out = `<${this.tag}>`
        for (const child of this._children) {
            out += `\n  ${child.toString().replace(/\n/g, '\n  ')}`
        }
        out += `\n</${this.tag}>`
        return out
    }
}




export { Bloc }