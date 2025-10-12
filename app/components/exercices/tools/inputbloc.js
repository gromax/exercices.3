import Bloc from "./bloc";
import { RadioView, UnknownView } from "../run/views";

/**
 * Bloc représentant un champ de saisie (input, radio...)
 * Exemple :
 * <radio:name>
 *  <expected:0>
 *  0=>'y=m*x+p'
 *  1=> 'x=k'
 * </radio>
 * 
 * Ou encore :
 * <input:xM>
 *  <tag:x_M>
 *  <type:nombre>
 *  <expected:(@xA+@xB)/2>
 * </input>
 */


class InputBloc extends Bloc {
    static LABELS = ['input', 'radio']
    constructor(label, paramsString) {
        super(label, paramsString, false);
        if (!paramsString) {
            throw new Error(`<${label}> doit avoir un nom (ex: <${label}:le_nom>)`);
        }
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

    /**
     * renvoie la valeur associée à une étiquette
     * en particulier dans un cas radio
     * @param {string} key 
     * @return {string|undefined} la valeur ou undefined si pas trouvée
     */
    getValueTag(key) {
        if (this.tag === 'radio') {
            return this._options ? this._options[key] : undefined;
        }
        return key;
    }
}

export default InputBloc;