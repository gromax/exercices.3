import _ from "underscore"
import InputBloc from "./inputbloc"
import { InputView, InputResultView } from "../../views/inputview"
import {
    checkFormat,
    checkValue,
    checkExcluded,
    standardName
} from "@mathstools/checkers/check"
import { formatValue } from "@components/exercices/tools/maths/misc/formatvalue"
import { View } from "backbone.marionette"
import { AnyView, NestedInput } from "@types"
import TextBloc from "../textbloc"
import { getStringOption } from "../../misc"

class InputTextBloc extends InputBloc {
    static readonly LABEL = 'input'
    static readonly ALLOWED_PARAMS = [
        'format', 'keyboard', 'placeholder', 'tag', 'excluded', 'solution', 'tagsolution'
    ]
    protected _format:Array<string> = []
    
    protected _getView(answers:Record<string, string>):AnyView {
        // On peut accepter un bloc de texte de type aide
        // D'autres enfants seront ignorés
        const aideBlocs:Array<TextBloc> = this._children.filter(
            (child): child is TextBloc => child instanceof TextBloc && child.isHelp
        )
        if (aideBlocs.length > 1) {
            console.warn(`Le bloc <input:${this._name}> contient plusieurs blocs d'aide. Seul le premier sera pris en compte.`)
        }
        if (aideBlocs.length > 0) {
            if (typeof this.params.keyboard === 'undefined') {
                this.params.keyboard = []
            } else if (!Array.isArray(this.params.keyboard)) {
                this.params.keyboard = [this.params.keyboard]
            }
            if (!this.params.keyboard.includes('help')) {
                this.params.keyboard.push('help')
            }
        }
        // keyboard doit être un tableau
        if (typeof this.params.keyboard !== "undefined" && !Array.isArray(this.params.keyboard)) {
            this.params.keyboard = [this.params.keyboard]
        }
        const view =  new InputView({
            name: this._name,
            tag: this.params.tag || this._name,
            answer: answers[this._name] || null,
            keyboard: this.params.keyboard || [],
            placeholder: getStringOption(this.params, "placeholder", '')
        })

        const helpViews = aideBlocs.map(bloc => {
            const v = bloc.view(answers) as View<any>
            (v as any).options.showButton = false
            return v
        })

        view.on("render", () => {
            const el = view.el.querySelector('.js-help-region')
            for (const hv of helpViews) {
                el.appendChild(hv.el)
                hv.render()
            }
        })
        return view
    }

    protected setParam(key:string, value:NestedInput):void {
        const lowerKey = key.toLocaleLowerCase()
        if (lowerKey === 'format') {
            if (typeof value !== "string") {
                throw new Error(`<${key}:###> devrait être un texte.`)
            }
            // je veux éviter un format non défini
            const standard = standardName(value)
            if (standard === "") {
                throw new Error(`<${key}:###> Format inconnu pour le bloc <input:${this._name}> : ${value}`)
            }
            // pour certains formats, je modifie aussi le clavier
            if (standard === "infini") {
                this.setParam('keyboard', "minfini")
                this.setParam('keyboard', "pinfini")
            } else if (standard === "empty") {
                this.setParam('keyboard', "empty")
            }
            if (standard === "ensemble") {
                this.setParam('keyboard', 'minfini')
                this.setParam('keyboard', 'pinfini')
                this.setParam('keyboard', 'empty')
                this.setParam('keyboard', 'union')
            }
            if (!this._format.includes(standard)) {
                this._format.push(standard)
            }
            return
        }
        super.setParam(key, value)
    }

    /**
     * réalise la validation de la saisie
     * renvoi true si ok, message d'erreur sinon
     * si pas d'argument, renvoie le name à valider
     * @param {string|undefined} userValue 
     * @returns {true|string} true si ok, message d'erreur sinon
     */
    validation(userValue?:string):true|string {
        if (typeof userValue === 'undefined') {
            return this._name
        }
        const formatisValid = checkFormat(userValue, this._format || 'none')
        if (formatisValid !== true) {
            // message d'erreur ou false
            return formatisValid
        }
        // Vérification que ce n'est pas une valeur exclue
        if (typeof this.params.excluded !== "undefined") {
            if (this._verifyExcluded(userValue)) {
                return "Cette valeur n'est pas acceptée."
            }
        }
        return true
    }

    /**
     * Calcule le score et la vue
     * @param {Record<string, string>} data 
     */
    protected _calcResult(userData:Record<string, string>):[AnyView, number] {
        const name = this._name
        const userValue = userData[name] || ''
        const userValueTag = userValue.includes('\\') ? `$${userValue}$` : userValue
        const solution = this.params.solution
        const tag = this.params.tag
        const format = this._format || 'none'
        const entete = tag?`${tag} : `:''
        if (!solution) {
            throw new Error(`Dans <${this.tag}:${this._name}>, la solution doit être spécifiée.`)
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
            let solutionFormatted = (typeof this.params.tagsolution !== 'undefined')
                ? this.params.tagsolution
                : formatValue(solution, format)
            // Il peut arriver que l'on envisage plusieurs formules mais qui au final
            // donne le même résultat formaté. Dans ce cas il faut éviter les répétitions
            if (Array.isArray(solutionFormatted)) {
                solutionFormatted = _.uniq(solutionFormatted)
                if (solutionFormatted.length == 1) {
                    solutionFormatted = solutionFormatted[0]
                }
            }
            const complement = Array.isArray(solutionFormatted)
                ? `Les bonnes réponses possibles étaient : ${solutionFormatted.join(' ; ')}.`
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

    protected _verify(userValue:string, solution:NestedInput):boolean {
        if (Array.isArray(solution)) {
            return solution.some(sol => this._verify(userValue, sol))
        }
        return checkValue(userValue, solution, this._format || 'none')
    }

    protected _verifyExcluded(userValue:string):boolean {
        if (typeof this.params.excluded === "undefined") {
            return false
        }
        const excluded = this.params.excluded
        return checkExcluded(userValue, excluded, this._format || 'none')
    }

    protected verifyNeededParams():void {
        if (typeof this._format === 'undefined') {
            throw new Error(`Dans <${this.tag}:${this._name}>, le format doit être spécifié.`)
        }
        if (!this.params.solution) {
            throw new Error(`Dans <${this.tag}:${this._name}>, la solution doit être spécifiée.`)
        }
    }

    protected verifyMyChildren():void {
        // on accepte les TextNode et les Text
        if (this._children.some(child => !((child instanceof TextBloc)&& child.isHelp))) {
            throw new Error(`<${this.tag}:${this._name}> ne peut avoir que des blocs d'aide comme enfants.`)
        }
    }
}

export default InputTextBloc