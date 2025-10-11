import Bloc from "./bloc";
import { RadioView, UnknownView } from "../run/views";

/**
 * Bloc représentant un champ de saisie (input, radio...)
 * Exemple :
 * <radio:name>
 *  <answer:0>
 *  0=>'y=m*x+p'
 *  1=> 'x=k'
 * </radio>
 * 
 * Ou encore :
 * <input:xM>
 *  <tag:x_M>
 *  <type:nombre>
 *  <good:(@xA+@xB)/2>
 * </input>
 */


class InputBloc extends Bloc {
    static LABELS = ['input', 'radio']
    constructor(label, paramsString) {
        super(label, paramsString, false);
        this._category = 'input';
    }

    _customView() {
        if (this.tag === 'input') {
            return new UnknownView('input', {
                result: this._result
            });
        }
        if (this.tag === 'radio') {
            const items = _.shuffle(Object.entries(this._options || {}));
            return new RadioView({
                name: this.header,
                items: items
            });
        }
    }
}

export default InputBloc;