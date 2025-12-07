import InputBloc from "./inputbloc.js"
import RadioView from "../../blocsviews/radioview.js";
import { InputResultView } from "../../blocsviews/inputview.js";


class RadioBloc extends InputBloc {
    static LABEL = 'radio'
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

    _calcResult(data) {
        const name = this.header;
        const userValue = data[name] || '';
        const userValueTag = this._options[userValue];
        const solution = this.params.solution;
        const solutionTag = this._options[solution];
        const tag = this.params.tag;
        const entete = tag?`${tag} : `:'';
        if (!solution) {
            this._score = 0;
            this._resultView = new InputResultView({
                name: name,
                success: false,
                message: entete + `Aucune réponse attendue.`,
            });
            return
        }
        // C'est là qu'il faudra prévoir les divers vérifications
        if (solution == userValue) {
            this._score = 1;
            this._resultView = new InputResultView({
                name: name,
                success: true,
                message: `${entete}${userValueTag} est une bonne réponse.`,
                score: 1
            });
            return;
        }
        const message = `${userValueTag} est une Mauvaise réponse.`;
        const complement = `La réponse attendue était : ${solutionTag}.`;
        
        this._score = 0;
        this._resultView = new InputResultView({
            name: name,
            success: false,
            message: entete + message + '\n' + complement,
            score: 0
        });
    }
}

export default RadioBloc;