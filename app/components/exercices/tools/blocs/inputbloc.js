import Bloc from "./bloc";
import RadioView from "../blocsviews/radioview.js";
import InputView from "../blocsviews/inputview.js";
import { checkValue, formatValue } from '../maths/misc/check.js';

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
        // On peut accepter un bloc de texte de type aide
        // D'autres enfants seront ignorés
        const aideBlocs = this._children.filter(child => (typeof child.isHelp === 'function') && child.isHelp());
        if (aideBlocs.length > 1) {
            console.warn(`Le bloc <input:${this.header}> contient plusieurs blocs d'aide. Seul le premier sera pris en compte.`);
        }
        if (aideBlocs.length > 0) {
            this.params.keyboard = this.params.keyboard ?? [];
            if (!this.params.keyboard.includes('help')) {
                this.params.keyboard.push('help');
            }
        }
        // keyboard doit être un tableau
        if (typeof this.params.keyboard !== "undefined" && !Array.isArray(this.params.keyboard)) {
            this.params.keyboard = [this.params.keyboard];
        }
        const view =  new InputView({
            name: this.header,
            tag: this.params.tag || this.header,
            answer: answers[this.header] || null,
            keyboard: this.params.keyboard || []
        });

        const helpViews = aideBlocs.map(bloc => {
            const v = bloc._customView(answers);
            v.options.showButton = false;
            return v;
        });

        view.on("render", () => {
            const el = view.el.querySelector('.js-help-region');
            for (const hv of helpViews) {
                el.appendChild(hv.el);
                hv.render();
            }
        });
        return view;
    }

    setParam(key, value) {
        if (key === 'format') {
            if (value === "inf") {
                console.warn(`Le format "inf" pour le bloc <input:${this.header}> est obsolète. Utilisez "infini" à la place.`);
                value = "infini";
            } else if (value === "vide") {
                console.warn(`Le format "vide" pour le bloc <input:${this.header}> est obsolète. Utilisez "empty" à la place.`);
                value = "empty";
            }
            // je veux éviter un format non défini
            if (value !== "infini" &&
                value !== "numeric" &&
                value !== "none" &&
                value !== "expand" &&
                value !== "empty" &&
                !value.startsWith("round:") &&
                !value.startsWith("erreur:")
            ) {
                console.warn(`Format inconnu pour le bloc <input:${this.header}> : ${value}`);
            }
            // pour certains formats, je modifie aussi le clavier
            if (value === "infini") {
                this.setParam('keyboard', "infini");
            } else if (value === "empty") {
                this.setParam('keyboard', "empty");
            }
            
        }
        super.setParam(key, value);
    }

    verification(data) {
        const name = this.header;
        const userValue = data[name] || '';
        const userValueTag = userValue.includes('\\') ? `$${userValue}$` : userValue;
        const solution = this.params.solution;
        const tag = this.params.tag;
        const format = this._params.format || 'none';
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
        if (this._verify(userValue, solution)) {
            const message = `${userValueTag} est une bonne réponse.`;
            return {
                name: name,
                success: true,
                message: entete + message,
                score: 1
            };
        } else {
            const message = `${userValueTag} est une Mauvaise réponse.`;
            const solutionFormatted = (typeof this.params.tagSolution !== 'undefined')
                ? this.params.tagSolution
                : formatValue(solution, format);
            const complement = Array.isArray(solutionFormatted)
                ? `Les bonnes réponses possibles étaient : ${solutionFormatted.join(', ')}.`
                :`La réponse attendue était : ${solutionFormatted}.`;
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
        return checkValue(userValue, solution, this._params.format || 'none');
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