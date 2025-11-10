import Bloc from "./bloc";
import { RadioView, InputView, UnknownView } from "../run/views";
import MyMath from '@tools/mymath.js';

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
    static make(label, paramsString) {
        if (label === 'input') {
            return new InputTextBloc(label, paramsString);
        }
        if (label === 'radio') {
            return new RadioBloc(label, paramsString);
        }
    }

    setParam(key, value) {
        if (key === 'keyboard') {
            if (this._params.keyboard === undefined) {
                this._params.keyboard = [];
            }
            this._params.keyboard.push(value);
            return;
        }
        super.setParam(key, value);
    }

    constructor(label, paramsString) {
        super(label, paramsString, false);
        if (!paramsString) {
            throw new Error(`<${label}> doit avoir un nom (ex: <${label}:le_nom>)`);
        }
        this._category = 'input';
    }

    nombrePts() {
        return 1;
    }
}

class InputTextBloc extends InputBloc {
    _customView(answers) {
        return new InputView({
            name: this.header,
            tag: this.params.tag || this.header,
            answer: answers[this.header] || null,
            keyboard: this.params.keyboard || []
        });
    }

    verification(data) {
        const name = this.header;
        const userValue = data[name] || '';
        const userValueTag = userValue.includes('\\') ? `$${userValue}$` : userValue;
        const solution = this.params.solution;
        const tag = this.params.tag;
        const entete = tag?`${tag} : `:'';
        if (!solution) {
            return {
                name: name,
                success: false,
                message: entete + `Aucune réponse attendue.`,
                score: 0
            };
        }
        // C'est là qu'il faudra prévoir les divers vérifications
        // solution pourrait être un tableau et alors il suffit qu'une valeur convienne
        if (this._verify(MyMath.parseUser(userValue), solution)) {
            const message = `${userValueTag} est une bonne réponse.`;
            return {
                name: name,
                success: true,
                message: entete + message,
                score: 1
            };
        } else {
            const message = `${userValueTag} est une Mauvaise réponse.`;
            const complement = Array.isArray(solution)
                ? `La réponse attendue était : $${MyMath.latex(solution)}$.`
                : `Les bonnes réponses possibles étaient : $${solution.map(MyMath.latex).join('$, $')}$.`;
            return {
                name: name,
                success: false,
                message: entete + message + '\n' + complement,
                score: 0
            };
        }
    }

    _verify(userValue, solution) {
        if (Array.isArray(solution)) {
            return solution.some(sol => this._verify(userValue, sol));
        }
        return MyMath.compare(userValue, solution, '==', {});
    }
}

class RadioBloc extends InputBloc {
    constructor(label, paramsString) {
        super(label, paramsString);
        this._options = {};
    }

    _customView(answers) {
        const items = _.shuffle(Object.entries(this._options || {}));
        return new RadioView({
            name: this.header,
            items: items,
            answer: answers[this.header] || null
        });
    }

    verification(data) {
        const name = this.header;
        const userValue = data[name] || '';
        const userValueTag = this._options[userValue];
        const solution = this.params.solution;
        const solutionTag = this._options[solution];
        const tag = this.params.tag;
        const entete = tag?`${tag} : `:'';
        if (!solution) {
            return {
                name: name,
                success: false,
                message: entete + `Aucune réponse attendue.`,
                score: 0
            };
        }
        // C'est là qu'il faudra prévoir les divers vérifications
        if (solution == userValue) {
            return {
                name: name,
                success: true,
                message: `${entete}${userValueTag} est une bonne réponse.`,
                score: 1
            };
        }
        const message = `${userValueTag} est une Mauvaise réponse.`;
        const complement = `La réponse attendue était : ${solutionTag}.`;
        return {
            name: name,
            success: false,
            message: entete + message + '\n' + complement,
            score: 0
        };
    }



}

export default InputBloc;