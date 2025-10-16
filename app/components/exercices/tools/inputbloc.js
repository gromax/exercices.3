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

    _customView(answers) {
        if (this.tag === 'input') {
            return new UnknownView('input', {
                result: this._result
            });
        }
        if (this.tag === 'radio') {
            const items = _.shuffle(Object.entries(this._options || {}));
            return new RadioView({
                name: this.header,
                items: items,
                answer: answers[this.header] || null
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

    nombrePts() {
        return 1;
    }

    verification(data) {
        const name = this.header;
        const userValue = data[name] || '';
        const userValueTag = this.getValueTag(userValue);
        const expectedValue = this.params.expected;
        const tag = this.params.tag;
        const entete = tag?`${tag} : `:'';
        if (!expectedValue) {
            return {
                name: name,
                success: false,
                message: entete + `Aucune réponse attendue.`,
                user: userValue,
                score: 0
            };
        }
        // C'est là qu'il faudra prévoir les divers vérifications
        if (userValue == expectedValue) {
            const message = `${userValueTag} est une bonne réponse.`;
            return {
                name: name,
                success: true,
                message: entete + message,
                user: userValue,
                score: 1
            };
        } else {
            const message = `${userValueTag} est une Mauvaise réponse.`;
            const complement = `La réponse attendue était : ${expectedValue}.`;
            results[name] = {
                success: false,
                message: entete + message + '\n' + complement,
                user: userValue,
                score: 0
            };
        }
    }

}

export default InputBloc;