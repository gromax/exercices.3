/**
 * L'objectif de cette classe est de gérer des blocs
 * de rendu identifiés par une balise de type <tag param1 param2 ...>
 */

import _ from 'underscore'
import { Node, SimpleNode } from '../node'
import { AnyView, TParams, NestedInput } from '@types'
import FormItemImplementation from '../implementation/formitem'
import Colors from '../colors'
import Parameter from '../parameter'
import Option from '../option'




abstract class Bloc extends Node {
    protected _children:Array<Node>
    protected _closed:boolean
    protected _paramsString:string

    constructor(tag:string, paramsString:string, closed:boolean) {
        super(tag)
        this._children = []
        this._closed = closed || false
        this._paramsString = paramsString
    }

    get header():string {
        return this._paramsString || ''
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

abstract class FluxBloc extends Bloc {
    abstract getFlux(params:TParams):Array<Node>
}

class ContentBloc extends Bloc {
    protected _params:TParams
    protected _defaultOption?:string
    protected _options?:Array<Option>


    constructor(tag:string, paramsString:string, closed:boolean) {
        super(tag, paramsString, closed)
        this._params = {header: paramsString}
    }


    /**
     * Exécute les morceaux de code du bloc
     * et effectue les substitutions de texte nécessaire
     * de façon à obtenir un bloc de texte final qui pourra
     * être rendu.
     * @param {TParams} params
     */

    run(params:TParams):ContentBloc {
        if (this._runned) {
            throw new Error(`Le bloc <${this.tag}> a déjà été exécuté.`)
        }
        this._runned = true
        /*if (this.tag ==="shuffle") {
            // on mélange les enfants
            return _.shuffle(this._children)
        }*/
        const pile = [...this._children].reverse()
        this._children = []
        while (pile.length > 0) {
            let item = pile.pop()
            if (item instanceof Option) {
                this.setOption(item)
            } else if (item instanceof Parameter) {
                const result = item.getParam(params)
                this.setParam(item.tag, result)
            } else if (item instanceof SimpleNode) {
                const runned = item.runSimple(params)
                if (runned == "halt") {
                    break
                } else if (runned == "nothing") {
                    continue
                } else {
                    this._children.push(runned)
                }
            } else if (item instanceof ContentBloc) {
                const runned = item.run(params)
                this._children.push(runned)
            } else if (item instanceof FluxBloc) {
                const runned = item.getFlux(params)
                this._children.push(...runned.reverse())
            } else {
                throw new Error(`Unsupported item type: ${item.constructor.name}`)
            }
        }
        this.verifyMyChildren()
        this.verifyMyParams()
        return this
    }

    setOption(option:Option):void {
        if (!this.hasOptions) {
            throw new Error(`Le bloc <${this.tag}> n'accepte pas d'options.`)
        }
        if (this._defaultOption === undefined) {
            this._defaultOption = option.key
        }
        if (this._options === undefined) {
            this._options = []
        }
        this._options.push(option)
    }

    /**
     * Ajoute un paramètre au bloc
     * Si ce paramètre existe déjà, le paramètre devient un tableau
     * [] n'est donc requis que si on veut forcer  un tableau
     * avec une seule valeur
     * @param {string} key 
     * @param {NestedInput} value 
     */
    protected setParam(key:string, value:NestedInput):void {
        if (!this.hasParams) {
            throw new Error(`Le bloc <${this.tag}> n'accepte pas de paramètres.`)
        }
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

    nombrePts():number {
        let count = 0
        for (const item of this._children){
            if (typeof (item as any).IMPLEMENTATION_FORMITEM != 'undefined') {
                count += ((item as unknown) as FormItemImplementation).nombrePts()
            }
        }
        return count
    }

    /**
     * Lève une erreur si les enfants ne sont pas valides
     * @returns 
     */
    protected verifyMyChildren():void {
        return
    }

    get params():TParams {
        if (this.hasParams) {
            return this._params
        }
        throw new Error(`Un bloc <${this.tag}> n'a pas de paramètres`)
    }

    /**
     * Lève une erreur si les paramètres ne sont pas valides.
     * Déclencher après l'enregistrement des paramètres.
     * @returns {void}
     */
    protected verifyMyParams():void {
        return
    }

    get hasParams():boolean {
        return Boolean(this["HAS_PARAMS"])
    }

    get hasOptions():boolean {
        return Boolean(this["HAS_OPTIONS"])
    }
}

abstract class BlocWithView extends ContentBloc {
    protected _colors?:Colors
    readonly HAS_PARAMS = true

    protected abstract _getView(answers:Record<string, string>):AnyView

    view(answers:Record<string, string>):AnyView {
        if (!this._runned) {
            throw new Error("Le bloc doit être exécuté avant de pouvoir générer des vues.")
        }
        return this._getView(answers)
    }

    /**
     * Définir les couleurs à utiliser
     * @param {Colors} colors 
     */
    setColors(colors:Colors):void {
        this._colors = colors
    }

}


export { Bloc, ContentBloc, BlocWithView, FluxBloc }