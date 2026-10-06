import { BlocWithView } from "./contentbloc"
import { ChoicesView } from "../views/choice"
import { AnyView } from '@types'
import ChoiceManager from './choicemanager'

class ChoiceBloc extends BlocWithView {
    static readonly LABELS = ['choices', 'choix', 'choice']
    static readonly ALLOWED_PARAMS = ChoiceManager.ALLOWED_PARAMS
    static readonly HAS_OPTIONS = true
    static readonly ACCEPTS_HEADER = false
    protected _getView(answers:Record<string, string>):AnyView {
        const manager = new ChoiceManager(
            this._params,
            this._colors,
            this._options,
            false
        )
        return new ChoicesView({
            collection: manager.collection,
            button: false
        })
    }
}

export default ChoiceBloc
