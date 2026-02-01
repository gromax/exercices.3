import Bloc from "./bloc"
import { ChoicesView } from "../views/choice"
import { AnyView } from '@types'
import ChoiceManager from './choicemanager'

class ChoiceBloc extends Bloc {
    static readonly LABELS = ['choices', 'choix']
    
    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
    }

    protected _getView(answers:Record<string, string>):AnyView {
        const manager = new ChoiceManager(this._params, this._colors, this._options, false)
        return new ChoicesView({
            collection: manager.collection,
            button: false
        })
    }
}

export default ChoiceBloc
