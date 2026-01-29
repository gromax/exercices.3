import Bloc from "./bloc"
import Colors from "../colors"
import { ChoicesView } from "../views/choice"
import { AnyView } from '@types'
import ChoiceManager from './choicemanager'

class ChoiceBloc extends Bloc {
    private _colors?:Colors
    static readonly LABELS = ['choices', 'choix']
    
    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
    }

    /**
     * Définir les couleurs à utiliser
     * @param {Colors} colors
     */
    setColors(colors:Colors):void {
        this._colors = colors
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
