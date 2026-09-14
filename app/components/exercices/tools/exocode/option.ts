import { getValue } from '@mathstools/misc/substitution'
import MyMath from '@mathstools/mymath'
import { Node, TRunResult } from './node'
import { TParams } from "@types"

class Option extends Node{
    private _key:string
    private _value:string
    private _label:string

    static readonly REGEX = /^(?<key>@?[\w]+)\s*(?<label>\[\w+\])?\s*=>(?<value>.*)/
    static parse(line:string):Option|null {
        const m = line.match(Option.REGEX)
        if (m?.groups) {
            const key = m.groups.key
            const value = m.groups.value
            const label = m.groups.label
                ? m.groups.label.slice(1, -1)
                : ''
            return new Option(key, label, value)
        } else {
            return null
        }
    }

    private constructor(key:string, label:string,value:string) {
        super("option")
        this._key = key.trim()
        this._label = label.trim()
        this._value = value.trim()
    }

    get key():string {
        return this._key
    }
    
    get value():string {
        return this._value
    }

    get label():string {
        return this._label
    }

    getValue(params:TParams):Option {
        const key = this._key.startsWith('@')
            ? getValue(this._key, params)
            : this._key
        if (Array.isArray(key)) {
            throw new Error(`${this.toString()} : Une clé d'option ne peut être un tableau`)
        }
        const value = MyMath.substituteExpressions(this._value, params)
        const stringKey = String(key)
        if (isNaN(parseInt(stringKey))) {
            throw new Error(`${this.toString()} : Une clé d'option doit être un nombre entier après substitution`)
        }
        return new Option(String(key), this._label, value)
    }

    run(params:TParams):TRunResult {
        return "nothing"
    }

    toString():string {
        if (this._label) {
            return `${this._key} [${this._label}] => ${this._value}`
        }
        return `${this._key} => ${this._value}`
    }
}

export default Option