import { InputResultView } from "../../views/inputview"
import InputTextBloc from "./inputtextbloc"
import { checkFormat, checkValue, formatValue } from "@mathstools/misc/check"
import MyMath from "@mathstools/mymath"
import { AnyView } from "@types"


class InputEnsemble extends InputTextBloc {
    static readonly LABEL = 'inputensemble'

    constructor(tag:string, paramsString:string) {
        super(tag, paramsString)
        // le format sert à valider les bornes des intervalles
        // on pourra donc avoir des bornes infinies
        // autrement on autorisera numeric ou round:x ou erreur:x
        // si aucun, ce sera numeric par défaut
        this._format = ['infini'] // par défaut pas de format
        this._params.keyboard = ['minfini', 'pinfini', 'empty', 'union']
    }

    /**
     * réalise la validation de la saisie
     * renvoi true si ok, message d'erreur sinon
     * si pas d'argument, renvoie le name à valider
     * @param {string|undefined} userValue 
     * @returns {string|boolean} true si ok, message d'erreur sinon
     */
    validation(userValue?:string):boolean|string {
        if (typeof userValue === 'undefined') {
            return this._name
        }
        if (this._format.length == 1) {
            (this._format as Array<string>).push('numeric')
        }
        const val = userValue.trim()
        const results = this._cutInterval(val)
        if (results === null) {
            return `La valeur '${val}' n'est pas un ensemble d'intervalles valide.`
        }
        let last = null
        for (const item of results) {
            const lb = item.lowerBound
            const verif = checkFormat(lb, this._format)
            if (verif !== true) {
                return `La borne inférieure '${lb}' n'est pas au bon format : ${verif}`
            }
            const ub = item.upperBound
            const verif2 = checkFormat(ub, this._format)
            if (verif2 !== true) {
                return `La borne supérieure '${ub}' n'est pas au bon format : ${verif2}`
            }
            if (MyMath.compare(lb, ub, ">")) {
                return `L'intervalle ${item.lowerBracket}${lb}${ub}${item.upperBracket} n'est pas valide : la borne inférieure est plus grande que la borne supérieure.`
            }
            if (last !== null && MyMath.compare(last.upperBound, lb, ">")) {
                return `Les intervalles se chevauchent ou ne sont pas dans l'ordre croissant.`
            }
            // cas où les intervalles se touchent
            if (last !== null && (last.upperInclusive || item.lowerInclusive)
                              && MyMath.compare(last.upperBound, lb, "==")
               ) {
                return `Vous devez fusionner les intervalles ${last.lowerBracket}${last.lowerBound};${last.upperBound}${last.upperBracket} et ${item.lowerBracket}${lb};${item.upperBound}${item.upperBracket} car ils se touchent.`
            }
            last = item
        }
        return true
    }

    private _cutInterval(intervalStr:string): Array<{
        lowerBracket: string
        lowerInclusive: boolean
        lowerBound: string
        upperBound: string
        upperInclusive: boolean
        upperBracket: string
    }> {
        // intervalStr est de la forme [a;b] ou ]a;b[ etc.
        if (intervalStr == '∅' || intervalStr.toLowerCase() == 'empty' || intervalStr.toLowerCase() == 'vide') {
            return []
        }
        const regex = /^(\]|\[)([^;]*);([^;]*)(\]|\[)$/
        const blocs = intervalStr.split(/∪|union/)
        const results = []
        for (let bloc of blocs) {
            bloc = bloc.trim()
            const match = bloc.match(regex)
            if (!match) {
                return null
            }

            const r = {
                lowerBracket: match[1],
                lowerInclusive: match[1] === '[',
                lowerBound: match[2].trim(),
                upperBound: match[3].trim(),
                upperInclusive: match[4] === ']',
                upperBracket: match[4]
            }
            results.push(r)
        }
        return results
    }

    /**
     * Calcule le score et la vue
     * @param {Record<string, string>} data 
     */
    _calcResult(data:Record<string, string>):[AnyView, number] {
        const name = this.header
        const userValue = data[name] || ''
        const userValueTag = userValue.includes('\\') ? `$${userValue}$` : userValue
        const solution = this.params.solution
        const tag = this.params.tag
        if (this._format.length == 1) {
            (this._format as Array<string>).push('numeric')
        }
        const entete = tag?`${tag} : `:''
        if (!solution) {
            const score = 0
            const resultView = new InputResultView({
                name: name,
                success: false,
                message: entete + `Aucune réponse attendue.`,
            })
            return [resultView, score]
        }
        // C'est là qu'il faudra prévoir les divers vérifications
        // solution pourrait être un tableau et alors il suffit qu'une valeur convienne
        if (this._verify(userValue, solution)) {
            const message = `${userValueTag} est une bonne réponse.`
            const score = 1
            const resultView = new InputResultView({
                name: name,
                success: true,
                message: entete + message,
            })
            return [resultView, score]
        } else {
            const message = `${userValueTag} est une Mauvaise réponse.`
            const solutionFormatted = (typeof this.params.tagSolution !== 'undefined')
                ? this.params.tagSolution
                : this._formatSolution(solution)
            const complement = Array.isArray(solutionFormatted)
                ? `Les bonnes réponses possibles étaient : ${solutionFormatted.join(', ')}.`
                :`La réponse attendue était : ${solutionFormatted}.`
            const score = 0
            const resultView = new InputResultView({
                name: name,
                success: false,
                message: [entete + message, complement],
            })
            return [resultView, score]
        }
    }

    protected _verify(userValue:string, solution:string|Array<string>):boolean {
        if (Array.isArray(solution)) {
            return solution.some(sol => this._verify(userValue, sol))
        }
        if (this.validation(userValue) !== true) {
            return false
        }
        const results = this._cutInterval(userValue)
        const sols = this._cutInterval(solution)
        if (results === null || sols === null) {
            return false
        }
        if (results.length !== sols.length) {
            return false
        }
        for (let i = 0; i < results.length; i++) {
            const r = results[i]
            const s = sols[i]
            if (r.lowerBracket !== s.lowerBracket ||
                r.upperBracket !== s.upperBracket
            ) {
                return false
            }
            const lbComp = checkValue(r.lowerBound, s.lowerBound, this._format)
            if (lbComp !== true) {
                return false
            }
            const ubComp = checkValue(r.upperBound, s.upperBound, this._format)
            if (ubComp !== true) {
                return false
            }
        }
        return true
    }

    private _formatSolution(solution:string|Array<string>):string {
        if (Array.isArray(solution)) {
            return solution.map(sol => this._formatSolution(sol)).join(' ou ')
        }
        const results = this._cutInterval(solution)
        if (results === null) {
            return solution
        }
        if (results.length === 0) {
            return '$\\emptyset$'
        }
        return '$'+results.map(item => {
            const lb = formatValue(item.lowerBound, this._format).slice(1,-1) // pour enlever les $
            const ub = formatValue(item.upperBound, this._format).slice(1,-1)
            return `\\left${item.lowerBracket}${lb}\\,${ub}\\right${item.upperBracket}`
        }).join(' \\cup ')+'$'
    }
}

export default InputEnsemble