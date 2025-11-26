import Bloc from './bloc.js';
import TextView from '../blocsviews/textview.js';
import HelpView from '../blocsviews/helpview.js';

class TextBloc extends Bloc {
    static LABELS = ['text', 'texte', 'warning', 'aide', 'info', 'help'];
    constructor(tag, paramsString) {
        super(tag, paramsString, false);
        this._category = 'text';
    }

    run(params, caller) {
        if (this._runned) {
            // déjà exécuté
            return this;
        }
        super.run(params, caller);
        // pour un bloc de texte ne conserve que le texte
        this._children = this._children.filter(item => typeof item === 'string');
        this._children = this._children.join('\n').split('\n\n');
        return this;
    }

    isHelp() {
        return this.tag === 'help' || this.tag === 'aide';
    }

    _customView(answers) {
        const content = this._children;
        if (this.isHelp()) {
            return new HelpView({
                subtitle: this._params["header"] || this._params["subtitle"] || false,
                paragraphs: content,
            });
        }
        return new TextView({
            header: this._params["header"] || false,
            subtitle: this._params["subtitle"] || false,
            paragraphs: content,
            footer: this._params["footer"] || false,
            info: this.tag === "info",
            warning: this.tag === 'warning',
        });
    }
}

export default TextBloc;