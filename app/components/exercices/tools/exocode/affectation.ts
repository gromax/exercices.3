import { getValue } from '@mathstools/misc/substitution'
import evaluate from '@mathstools/pile/evaluation'
import Node from './node'
import MyMath from "@mathstools/mymath"
import { TParams, NestedArray, InputType, NestedInput } from "@types"

class Affectation extends Node {
    private _expression:string
    private _repeater:string|undefined
    private _isArrayAffectation:boolean
    private _approxOrder:number|undefined

    static parse(line:string):Affectation|null {
        // On va accepter les formes :
        // @name = ...
        // @name[] = ...
        // @name[] <:@tab> =
        // @name[] <:nombre> =
        // @name[] =?nombre

        const regex = /^@([a-zA-Z_][a-zA-Z0-9_]*)(\[\])?\s*(?:<:(.+)>)?\s*=(?:~([0-9]+))?\s*([^~]+)$/
        const m = line.match(regex)
        if (!m) {
            return null
        }
        const [, tag, brackets, repeater, approxOrder, expression] = m
        const isArrayAffectation = brackets !== undefined
        return new Affectation(tag, repeater, expression, isArrayAffectation, approxOrder)
    }

    private constructor(
        tag:string,
        repeater:string|undefined,
        expression:string,
        isArrayAffectation:boolean,
        approxOrder:string|undefined
    ) {
        super(tag)
        this._expression = expression
        this._repeater = repeater
        this._isArrayAffectation = isArrayAffectation
        this._approxOrder = typeof approxOrder === 'undefined'
            ? undefined
            : Number(approxOrder)
    }

    /**
     * Réalise l'affectation dans params
     * protectedParams sont des paramètres protégés qui ne peuvent pas être modifiés
     * @param {TParams} params 
     * @param {TParams} protectedParams 
     */
    doAffectation(params:TParams, protectedParams:TParams):void {
        if (this._tag in protectedParams) {
            // situation anormale, on ne peut pas écraser un paramètre protégé
            throw new Error(`Le paramètre ${this._tag} est protégé et ne peut pas être redéfini.`)
        }
        if (this._tag.startsWith('__')) {
            // situation anormale, on ne peut pas définir un paramètre réservé
            throw new Error(`Le paramètre ${this._tag} est interdit (commence par __).`)
        }
        if (this._isArrayAffectation && params[this._tag] !== undefined && !Array.isArray(params[this._tag])) {
            throw new Error(`Le paramètre ${this._tag} doit être un tableau.`)
        }

        if (this._isArrayAffectation && params[this._tag] === undefined) {
            // initialisation comme tableau
            params[this._tag] = []
        }

        if (!this._isArrayAffectation && Array.isArray(params[this._tag])) {
            throw new Error(`Le paramètre ${this._tag} ne devrait pas être un tableau.`)
        }

        if (this._repeater === undefined) {
            const result = this._evaluate({ ...params, ...protectedParams })
            this._assignValueInParams(result, params)
            return
        }

        const r = getValue(this._repeater, { ...params, ...protectedParams }) ?? this._repeater
        if (Array.isArray(r)) {
            const result = this._evaluateWithArrayRepeater({...params, ...protectedParams}, r)
            this._assignValueInParams(result, params)
        } else {
            // cas d'un répéteur entier
            const result = this._evaluateWithNumberRepeater({...params, ...protectedParams}, r)
            this._assignValueInParams(result, params)
        }
    }

    private _assignValueInParams(value:NestedInput, params:TParams) {
        if (Array.isArray(params[this._tag])) {
            (params[this._tag] as Array<NestedInput>).push(value)
        } else {
            params[this._tag] = value
        }
    }
    
    private _evaluate(params:TParams):NestedArray<InputType> {
        const value = evaluate(this._expression, params)
        if (typeof this._approxOrder === "undefined") {
            return value
        }
        return MyMath.toFixedArray(value, this._approxOrder)
    }

    private _evaluateWithArrayRepeater(params:TParams, repeater:Array<NestedArray<InputType>>) {
        // cas d'un répéteur tableau
        return repeater.map((item, index) => this._evaluate({ ...params, __v: item, __i: index }))
    }

    private _evaluateWithNumberRepeater(params:TParams, repeater:InputType) {
        const n = MyMath.toNumber(repeater)
        if (!Number.isInteger(n) || n < 0) {
            throw new Error(`La valeur de répétition pour le paramètre ${this._tag} doit être un entier positif ou un tableau.`)
        }
        const arr = Array.from({ length: n }, (_, i) => i)
        return arr.map((item) => this._evaluate({ ...params, __i: item }))
    }

    toString():string {
        if (this._repeater!==undefined) {
            return `@${this._tag} <:${this._repeater}> = ${this._expression}`
        }
        return `@${this._tag} = ${this._expression}`
    }

    run(params:TParams, caller:any):null {
        this.doAffectation(params, {})
        return null
    }
}

export default Affectation