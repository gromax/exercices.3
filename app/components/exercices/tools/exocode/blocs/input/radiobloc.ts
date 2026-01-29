import _ from "underscore"
import InputBloc from "./inputbloc.js"
import RadioView from "../../views/radioview.js"
import { InputResultView } from "../../views/inputview.js"
import { AnyView } from "@types"

class RadioBloc extends InputBloc {
    protected _options:Record<string, string>

    static readonly LABEL = 'radio'

    constructor(label:string, paramsString:string) {
        super(label, paramsString)
        this._options = {}
    }

    /**
     * réalise la validation de la saisie
     * renvoi true si ok, message d'erreur sinon
     * si pas d'argument, renvoie le name à valider
     * @param {string|undefined} userValue 
     * @returns {string|boolean} true si ok, message d'erreur sinon
     */
    validation(userValue?:string):string|boolean {
        if (typeof userValue === 'undefined') {
            return this.header
        }
        // le radio sera toujours valide grâce au formulaire
        // qui requiert une réponse
        return true
    }

    protected _getView(answers:Record<string, string>):AnyView {
        const items = _.shuffle(Object.entries(this._options || {}))
        return new RadioView({
            name: this.header,
            items: items,
            answer: answers[this.header] || null
        })
    }

    protected _calcResult(userData:Record<string, string>):[AnyView, number] {
        const name = this.header
        const userValue = userData[name] || ''
        const userValueTag = this._options[userValue]
        const solution = this.params.solution
        const solutionTag = this._options[solution]
        const tag = this.params.tag
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
        if (solution == userValue) {
            const score = 1
            const resultView = new InputResultView({
                name: name,
                success: true,
                message: `${entete}${userValueTag} est une bonne réponse.`,
                score: 1
            })
            return [resultView, score]
        }
        const message = `${userValueTag} est une Mauvaise réponse.`
        const complement = `La réponse attendue était : ${solutionTag}.`

        const score = 0
        const resultView = new InputResultView({
            name: name,
            success: false,
            message: entete + message + '\n' + complement,
            score: 0
        })
        return [resultView, score]
    }
}

export default RadioBloc