import InputBloc from "./inputbloc"
import { InputView, InputResultView } from "../../blocsviews/inputview"
import { checkFormat, checkValue, formatValue } from "@mathstools/misc/check"
import MyMath from "@mathstools/mymath"

class InputEnsemble extends InputBloc {
    static LABEL = 'inputensemble'
    constructor(label, paramsString) {
        super(label, paramsString);
        // le format sert à valider les bornes des intervalles
        // on pourra donc avoir des bornes infinies
        // autrement on autorisera numeric ou round:x ou erreur:x
        // si aucun, ce sera numeric par défaut
        this._params.format = ['infini']; // par défaut pas de format
        this._params.keyboard = ['minfini', 'pinfini', 'empty', 'union'];
    }

    _customView(answers) {
        // On peut accepter un bloc de texte de type aide
        // D'autres enfants seront ignorés
        const aideBlocs = this._children.filter(child => (typeof child.isHelp === 'function') && child.isHelp());
        if (aideBlocs.length > 1) {
            console.warn(`Le bloc <inputensemble:${this.header}> contient plusieurs blocs d'aide. Seul le premier sera pris en compte.`);
        }
        if (aideBlocs.length > 0 && !this.params.keyboard.includes('help')) {
            this.params.keyboard.push('help');
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
            // infini et vide vont de soi ici
            // je veux éviter un format non défini
            if ( value !== "numeric" &&
                !value.startsWith("round:") &&
                !value.startsWith("erreur:")
            ) {
                console.warn(`Format inconnu pour le bloc <inputensemble:${this.header}> : ${value}`);
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
        if (this._params.format.length == 1) {
            this._params.format.push('numeric')
        }
        const val = userValue.trim()
        const results = this.#cutInterval(val)
        if (results === null) {
            return `La valeur '${val}' n'est pas un ensemble d'intervalles valide.`;
        }
        let last = null
        for (const item of results) {
            const lb = item.lowerBound
            const verif = checkFormat(lb, this._params.format)
            if (verif !== true) {
                return `La borne inférieure '${lb}' n'est pas au bon format : ${verif}`;
            }
            const ub = item.upperBound
            const verif2 = checkFormat(ub, this._params.format)
            if (verif2 !== true) {
                return `La borne supérieure '${ub}' n'est pas au bon format : ${verif2}`;
            }
            if (MyMath.compare(lb, ub, ">")) {
                return `L'intervalle ${item.lowerBracket}${lb};${ub}${item.upperBracket} n'est pas valide : la borne inférieure est plus grande que la borne supérieure.`;
            }
            if (last !== null && MyMath.compare(last.upperBound, lb, ">")) {
                return `Les intervalles se chevauchent ou ne sont pas dans l'ordre croissant.`;
            }
            // cas où les intervalles se touchent
            if (last !== null && (last.upperInclusive || item.lowerInclusive)
                              && MyMath.compare(last.upperBound, lb, "==")
               ) {
                return `Vous devez fusionner les intervalles ${last.lowerBracket}${last.lowerBound};${last.upperBound}${last.upperBracket} et ${item.lowerBracket}${lb};${item.upperBound}${item.upperBracket} car ils se touchent.`;
            }
            last = item;
        }
        return true;
    }

    #cutInterval(intervalStr) {
        // intervalStr est de la forme [a;b] ou ]a;b[ etc.
        if (intervalStr == '∅' || intervalStr.toLowerCase() == 'empty' || intervalStr.toLowerCase() == 'vide') {
            return [];
        }
        const regex = /^(\]|\[)([^;]*);([^;]*)(\]|\[)$/
        const blocs = intervalStr.split(/∪|union/)
        const results = []
        for (let bloc of blocs) {
            bloc = bloc.trim()
            const match = bloc.match(regex)
            if (!match) {
                return null
            }

            const r = {
                lowerBracket: match[1],
                lowerInclusive: match[1] === '[',
                lowerBound: match[2].trim(),
                upperBound: match[3].trim(),
                upperInclusive: match[4] === ']',
                upperBracket: match[4]
            }
            results.push(r)
        }
        return results
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
        if (this._params.format.length == 1) {
            this._params.format.push('numeric')
        }
        const format = this._params.format;
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
                : this.formatSolution(solution, format);
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
        if (this.validation(userValue) !== true) {
            return false;
        }
        const results = this.#cutInterval(userValue)
        const sols = this.#cutInterval(solution)
        if (results === null || sols === null) {
            return false;
        }
        if (results.length !== sols.length) {
            return false;
        }
        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            const s = sols[i];
            if (r.lowerBracket !== s.lowerBracket ||
                r.upperBracket !== s.upperBracket
            ) {
                return false;
            }
            const lbComp = checkValue(r.lowerBound, s.lowerBound, this._params.format);
            if (lbComp !== true) {
                return false;
            }
            const ubComp = checkValue(r.upperBound, s.upperBound, this._params.format);
            if (ubComp !== true) {
                return false;
            }
        }
        return true;
    }

    formatSolution(solution) {
        if (Array.isArray(solution)) {
            return solution.map(sol => this.formatSolution(sol)).join(' ou ');
        }
        const results = this.#cutInterval(solution)
        if (results === null) {
            return solution;
        }
        if (results.length === 0) {
            return '$\\emptyset$';
        }
        return '$'+results.map(item => {
            const lb = formatValue(item.lowerBound, this._params.format).slice(1,-1); // pour enlever les $
            const ub = formatValue(item.upperBound, this._params.format).slice(1,-1);
            return `\\left${item.lowerBracket}${lb}\\,;${ub}\\right${item.upperBracket}`;
        }).join(' \\cup ')+'$';
    }
}

export default InputEnsemble;