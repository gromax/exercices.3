import InputBloc from './inputbloc'
import { ChoiceManager } from '../choice'
import { ChoicesView, ChoiceView, ChoiceFormLayout } from '../../blocsviews/choice'

class InputChoice extends InputBloc {
    static LABELS = ['inputchoice', 'inputchoix', 'choixinput', 'choiceinputchoix']

    nombrePts() {
        return Object.keys(this._options || {}).length
    }

    /**
     * Définir les couleurs à utiliser
     * @param {Colors} colors
     */
    setColors(colors) {
        this._colors = colors
    }

    validation(userValue) {
        if (userValue.includes('0')) {
            return "Vous devez faire un choix pour tous les items."
        }
        return true
    }

    _getManager() {
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
    _customView(answers) {
        const manager = this._getManager()
        const vmax = typeof this._params.max !== 'undefined'
            ? Math.max(parseInt(this._params.max), manager.valuemax)
            : manager.valuemax

        const n = this._options ? Object.keys(this._options).length : 0;
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
            );
        });
        layout.on('render', function() {
            layout.showChildView('content', view);
        });
        return layout;
    }

    /**
     * Calcule le score et la vue
     * @param {*} data 
     */
    _calcResult(data) {
        const userValue = data[this.header] || ''
        const manager = this._getManager()
        this._score = manager.verification(userValue)
        this._resultView = manager.collection.map(model => {
            return new ChoiceView({ model: model })
        })
    }

    get score() {
        return this._score || 0;
    }
}

export default InputChoice;