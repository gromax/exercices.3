import { Bloc } from './bloc'
import type { AnyView, TParams, NestedInput } from '@types'
import { SimpleNode } from '../simplenodes/simplenode'
import { FluxBloc } from '../flux/fluxbloc'
import { FluxNode } from '../flux/fluxnode'
import Option from '../simplenodes/option'
import Colors from '../colors'
import FormItemImplementation from '../implementation/formitem'
import Parameter from '../simplenodes/parameter'

class ContentBloc extends Bloc {
    protected _params?:TParams
    protected _defaultOption?:string
    protected _options?:Array<Option>
    protected _halted:boolean = false

    constructor(tag:string) {
        super(tag)
        if (this.hasParams) {
            this._params = {}
        }
        if (this.hasOptions) {
            this._options = []
        }
    }

    setHalted():void {
        this._halted = true
    }

    /**
     * Exécute les morceaux de code du bloc
     * et effectue les substitutions de texte nécessaire
     * de façon à obtenir un bloc de texte final qui pourra
     * être rendu.
     * @param {TParams} params
     */

    run(params:TParams):void {
        if (this._runned) {
            throw new Error(`Le bloc <${this.tag}> a déjà été exécuté.`)
        }
        this._runned = true
        const pile = [...this._children].reverse()
        this._children = []
        while (pile.length > 0) {
            let item = pile.pop()
            if (item instanceof Option) {
                this.setOption(item.getValue(params))
            } else if (item instanceof Parameter) {
                const result = item.getParam(params)
                this.setParam(item.tag, result)
            } else if (item instanceof FluxNode) {
                const goOn = item.goOn(params)
                if (!goOn) {
                    this.setHalted()
                    break
                }
            } else if (item instanceof SimpleNode) {
                const runned = item.runSimple(params)
                if (runned === null) {
                    continue
                } else {
                    this._children.push(runned)
                }
            } else if (item instanceof ContentBloc) {
                item.run(params)
                this._children.push(item)
                if (item._halted) {
                    this.setHalted()
                    break
                }
            } else if (item instanceof FluxBloc) {
                const flux = item.getFlux(params)
                pile.push(...flux.reverse())
            } else {
                throw new Error(`Unsupported item type: ${item.constructor.name}`)
            }
        }
        this.verifyMyChildren()
        this.verifyNeededParams()
    }

    setOption(option:Option):void {
        if (!this.hasOptions) {
            throw new Error(`Le bloc <${this.tag}> n'accepte pas d'options.`)
        }
        if (this._defaultOption === undefined) {
            this._defaultOption = option.key
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
            throw new Error(`Le bloc <${this.tag}> n'accepte pas de paramètres. Paramètre <${key}:###/> rejeté.`)
        }
        const allowedParams = this.constructor["ALLOWED_PARAMS"]
        const lowerKey = key.toLocaleLowerCase()
        if (allowedParams && Array.isArray(allowedParams) && !allowedParams.includes(lowerKey)) {
            throw new Error(`Le paramètre <${key}> n'est pas autorisé pour le bloc <${this.tag}>.`)
        }
        const realKey = key.endsWith('[]')
            ? lowerKey.slice(0, -2)
            : lowerKey
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
    protected verifyNeededParams():void {
        return
    }

    get hasParams():boolean {
        return Boolean(this.constructor["HAS_PARAMS"])
    }

    get hasOptions():boolean {
        return Boolean(this.constructor["HAS_OPTIONS"])
    }

    /**
     * teste si le bloc peut être créé avec les paramètres fournis
     * @param {string} tag 
     * @param {string|null} paramsStrings 
     * @returns {false|ContentBloc} renvoie le bloc créé ou false en cas d'échec
     */
    static tryCreate<T extends ContentBloc>(
        this: {
            new(tag:string, paramsString:string): T,
            LABEL?: string,
            LABELS?: ReadonlyArray<string>,
            NEEDS_ID?: boolean,
            ACCEPTS_HEADER?: boolean
        },
        tag:string,
        paramsStrings:string|null
    ):false|T {
        if (this.LABEL && this.LABEL !== tag) {
            return false
        }
        if (this.LABELS && !this.LABELS.includes(tag)) {
            return false
        }
        if (this.NEEDS_ID && !paramsStrings) {
            throw new Error(`<${tag}> nécessite un identifiant`)
        }
        
        if (!this.ACCEPTS_HEADER && !this.NEEDS_ID && paramsStrings) {
            throw new Error(`<${tag}> n'accepte pas d'en-tête`)
        }
        return new this(tag, paramsStrings || '')
    }
}

abstract class BlocWithView extends ContentBloc {
    protected _colors?:Colors
    static readonly HAS_PARAMS = true

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

export { ContentBloc, BlocWithView }
