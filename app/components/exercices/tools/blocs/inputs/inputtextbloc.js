import InputBloc from "./inputbloc"
import { InputView, InputResultView } from "../../blocsviews/inputview"
import { checkFormat, checkValue, formatValue } from "@mathstools/misc/check"

class InputTextBloc extends InputBloc {
    static LABEL = 'input'
    _customView(answers) {
        // On peut accepter un bloc de texte de type aide
        // D'autres enfants seront ignorés
        const aideBlocs = this._children.filter(child => (typeof child.isHelp === 'function') && child.isHelp());
        if (aideBlocs.length > 1) {
            console.warn(`Le bloc <input:${this.header}> contient plusieurs blocs d'aide. Seul le premier sera pris en compte.`);
        }
        if (aideBlocs.length > 0) {
            if (typeof this.params.keyboard === 'undefined') {
                this.params.keyboard = [];
            } else if (!Array.isArray(this.params.keyboard)) {
                this.params.keyboard = [this.params.keyboard];
            }
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
                this.setParam('keyboard', "minfini");
                this.setParam('keyboard', "pinfini");
            } else if (value === "empty") {
                this.setParam('keyboard', "empty");
            }
            
        }
        super.setParam(key, value);
    }

    /**
     * réalise la validation de la saisie
     * renvoi true si ok, message d'erreur sinon
     * si pas d'argument, renvoie le name à valider
     * @param {string|undefined} userValue 
     * @returns {true|string} true si ok, message d'erreur sinon
     */
    validation(userValue) {
        if (typeof userValue === 'undefined') {
            return this.header;
        }
        return checkFormat(userValue, this._params.format || 'none');
    }

    /**
     * Calcule le score et la vue
     * @param {*} data 
     */
    _calcResult(data) {
        const name = this.header;
        const userValue = data[name] || '';
        const userValueTag = userValue.includes('\\') ? `$${userValue}$` : userValue;
        const solution = this.params.solution;
        const tag = this.params.tag;
        const format = this._params.format || 'none';
        const entete = tag?`${tag} : `:'';
        if (!solution) {
            this._score = 0;
            this._resultView = new InputResultView({
                name: name,
                success: false,
                message: entete + `Aucune réponse attendue.`,
            });
            return;
        }
        // C'est là qu'il faudra prévoir les divers vérifications
        // solution pourrait être un tableau et alors il suffit qu'une valeur convienne
        if (this._verify(userValue, solution)) {
            const message = `${userValueTag} est une bonne réponse.`;
            this._score = 1;
            this._resultView = new InputResultView({
                name: name,
                success: true,
                message: entete + message,
            });
            return;
        } else {
            const message = `${userValueTag} est une Mauvaise réponse.`;
            const solutionFormatted = (typeof this.params.tagSolution !== 'undefined')
                ? this.params.tagSolution
                : formatValue(solution, format);
            const complement = Array.isArray(solutionFormatted)
                ? `Les bonnes réponses possibles étaient : ${solutionFormatted.join(', ')}.`
                :`La réponse attendue était : ${solutionFormatted}.`;
            this._score = 0;
            this._resultView = new InputResultView({
                name: name,
                success: false,
                message: [entete + message, complement],
            });
        }
    }

    _verify(userValue, solution) {
        if (Array.isArray(solution)) {
            return solution.some(sol => this._verify(userValue, sol));
        }
        return checkValue(userValue, solution, this._params.format || 'none');
    }
}

export default InputTextBloc;