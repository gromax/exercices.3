/**
 * L'objectif de cette classe est de gérer des blocs
 * de rendu identifiés par une balise de type <tag param1 param2 ...>
 */

import _ from 'underscore'
import UnknownView from '../views/unknownview'
import TableView from '../views/tableview'
import Node from '../node'
import FormItemImplementation from '../implementation/formitem'
import { InputType, AnyView } from '@types'

class Bloc extends Node {
    protected _children:Array<Node>
    protected _closed:boolean
    protected _paramsString:string
    protected _params:Record<string, any>
    protected _defaultOption?:string
    protected _options?:Record<string, string>

    constructor(tag:string, paramsString:string, closed:boolean) {
        super(tag)
        this._children = []
        this._closed = closed || false
        this._paramsString = paramsString
        this._params = { header:paramsString }
    }

    /**
     * Ajoute un paramètre au bloc
     * Si ce paramètre existe déjà, le paramètre devient un tableau
     * [] n'est donc requis que si on veut forcer  un tableau
     * avec une seule valeur
     * @param {string} key 
     * @param {*} value 
     */
    setParam(key:string, value:InputType):void {
        const realKey = key.endsWith('[]')
            ? key.slice(0, -2)
            : key
        if (this._params[realKey] !== undefined) {
            if (!Array.isArray(this._params[realKey])) {
                this._params[realKey] = [this._params[realKey], value]
            } else {
                this._params[realKey].push(value)
            }
            return
        }
        if (key.endsWith('[]')) {
            // bien que ce soit la première valeur, on l'a met en tableau
            this._params[realKey] = [value]
        } else {
            this._params[realKey] = value
        }
    }

    get header():string {
        return this._paramsString || ''
    }

    get params():Record<string, any> {
        return this._params
    }

    get children():Array<Node> {
        return [...this._children]
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

    /**
     * Exécute les morceaux de code du bloc
     * et effectue les substitutions de texte nécessaire
     * de façon à obtenir un bloc de texte final qui pourra
     * être rendu.
     * @param {Object} params
     * @param {Bloc|null} caller le bloc appelant
     */
    run(params:Record<string, any>, caller:Bloc|null = null):Bloc|Array<Node> {
        if (this._runned) {
            throw new Error(`Le bloc <${this.tag}> a déjà été exécuté.`)
        }
        this._runned = true
        if (this.tag ==="shuffle") {
            // on mélange les enfants
            return _.shuffle(this._children)
        }
        const pile = [...this._children].reverse()
        this._children = []
        while (pile.length > 0) {
            let item = pile.pop()
            const runned = item.run(params, this)
            if (runned === null) {
                continue
            }
            if (Array.isArray(runned)) {
                pile.push(...runned.reverse())
            } else {
                this._children.push(runned)
            }
        }
        return this
    }

    protected _getView(answers:Record<string, string>):AnyView {
        if (this._tag === 'table') {
            return new TableView({
                rows: this._params.rows || [],
                rowheaders: this._params.rowheaders || null,
                colheaders: this._params.colheaders || null
            })
        }
        return new UnknownView({ name:this.tag, code: this.toString() })
    }

    view(answers:Record<string, string>):AnyView {
        if (!this._runned) {
            throw new Error("Le bloc doit être exécuté avant de pouvoir générer des vues.")
        }
        return this._getView(answers)
    }

    parseOption():[string, string, Record<string, string>] {
        if (this._tag !== 'option') {
            throw new Error("Seul un bloc <option> peut être analysé par cette méthode")
        }
        if (this._paramsString === '') {
            throw new Error("Un bloc <option> doit avoir une étiquette <option:étiquette>")
        }
        this.run({})
        return [this._paramsString, this._defaultOption, this._options]
    }

    setOption(key:string, value:string):void {
        if (this._defaultOption === undefined) {
            this._defaultOption = key
        }
        if (this._options === undefined) {
            this._options = {}
        }
        this._options[key] = value
    }

    toString():string {
        let out = `<${this.tag}>`
        for (const child of this._children) {
            out += `\n  ${child.toString().replace(/\n/g, '\n  ')}`
        }
        out += `\n</${this.tag}>`
        return out
    }

    nombrePts():number {
        let count = 0
        for (const item of this._children){
            if (typeof (item as any).IMPLEMENTATION_FORMITEM != 'undefined') {
                count += ((item as unknown) as FormItemImplementation).nombrePts()
            }
        }
        return count
    }

}

export default Bloc