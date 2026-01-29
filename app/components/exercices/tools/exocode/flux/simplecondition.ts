import MyMath from '../../maths/mymath'
import { substituteParams } from '../../maths/misc/substitution'
import { InputType } from "@types"
import LogicalNode from './logicalnode'

class SimpleCondition extends LogicalNode {
    private left:string
    private right:string
    private operator:string

    static parse(expr:string):null|SimpleCondition {
        const regex = /^(.*)(==|<=?|>=?|!=|exists)(.*)$/
        const m = expr.match(regex)
        if (!m) {
            return null
        }
        const [,left, operator, right] = m
        return new SimpleCondition(left, operator, right)
    }

    private constructor(left:string, operator:string, right:string) {
        super()
        this.left = left.trim()
        this.operator = operator
        this.right = right.trim()
        if (this.operator === 'exists') {
            if (this.right !== '') {
                throw new Error(`L'opérateur 'exists' ne doit pas avoir d'opérande à droite (${this.right}).`)
            }
            if (!/^@\w*$/.test(this.left)) {
                throw new Error(`L'opérateur 'exists' doit être précédé d'un paramètre de forme @name valide (${this.left}).`)
            }
        }
    }

    evaluate(params:Record<string,InputType>):boolean|Array<boolean> {
        if (this.operator === 'exists') {
            const paramName = this.left.substring(1)
            return params.hasOwnProperty(paramName)
        }
        const left = substituteParams(this.left, params)
        const right = substituteParams(this.right, params)
        if (Array.isArray(left)) {
            if (Array.isArray(right)) {
                if (left.length !== right.length) {
                    throw new Error("Erreur d'évaluation de l'expression conditionnelle : tailles incompatibles")
                }
                return left.map((v, i) => MyMath.compare(v, right[i], this.operator) as boolean)
            } else {
                return left.map(v => MyMath.compare(v, right, this.operator) as boolean)
            }
        }
        if (Array.isArray(right)) {
            return right.map(v => MyMath.compare(left, v, this.operator) as boolean)
        }
        
        return MyMath.compare(left, right, this.operator) as boolean
    }

    toString():string {
        return `${this.left} ${this.operator} ${this.right}`
    }
}

export default SimpleCondition