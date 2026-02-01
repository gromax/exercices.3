import InputBloc from './inputbloc'
import ChoiceManager from '../choicemanager'
import { ChoicesView, ChoiceView, ChoiceFormLayout } from '../../views/choice'
import { AnyView } from "@types"

class InputChoice extends InputBloc {
    static LABELS = ['inputchoice', 'inputchoix', 'choixinput', 'choiceinputchoix']
    private _manager?:ChoiceManager


    nombrePts():number {
        return Object.keys(this._options || {}).length
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
        if (userValue.includes('0')) {
            return "Vous devez faire un choix pour tous les items."
        }
        return true
    }

    private _getManager():ChoiceManager {
        if (typeof this._manager === 'undefined') {
            this._manager = new ChoiceManager(
                this._params,
                this._colors,
                this._options,
                true
            )
        }
        return this._manager
    }

    private _getParamsMax():string|undefined {
        const pmax = this._params.max
        if (typeof pmax === "undefined") {
            return undefined
        }
        if (Array.isArray(pmax)) {
            throw new Error("Le paramètre max de inputchoice ne devrait pas être un tableau")
        }
        if (typeof pmax != "string" && typeof pmax !== "number") {
            throw new Error("Le paramètre max de inputchoice devrait être un simple nombre")
        }
        return String(pmax)
    }

    protected _getView(answers:Record<string, string>):AnyView {
        const manager = this._getManager()
        const pmax = this._getParamsMax()
        const vmax = typeof pmax !== 'undefined'
            ? Math.max(parseInt(pmax), manager.valuemax)
            : manager.valuemax

        const n = this._options ? Object.keys(this._options).length : 0
        const layout = new ChoiceFormLayout({
            name: this.header,
            value: '0'.repeat(n),
        })

        const view = new ChoicesView({
            collection: manager.collection,
            button: true,
        })

        view.on('item:click', (childView) => {
            childView.itemClick(
                vmax,
                this._colors,
                manager.squaresOnly,
                layout.$el.find(`input[name="${this.header}"]`),
                manager.notShuffledCollection
            )
        })
        layout.on('render', function() {
            layout.showChildView('content', view)
        })
        return layout
    }

    /**
     * Calcule le score et la vue
     * @param {Record<string, string>} userData 
     */
    protected _calcResult(userData:Record<string, string>):[AnyView, number] {
        const userValue = userData[this.header] || ''
        const manager = this._getManager()
        const score = manager.verification(userValue)
        const resultView = manager.collection.map(model => {
            return new ChoiceView({ model: model })
        })
        return [resultView, score]
    }
}

export default InputChoice