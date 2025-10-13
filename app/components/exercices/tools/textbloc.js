import Bloc from './bloc.js';
import TextNode from './textnode.js';
import { TextView, HelpView } from '../run/views.js';

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
        this._executionChildren = this._executionChildren.filter(item => typeof item === 'string');
        this._executionChildren = this._executionChildren.join('\n').split('\n\n');
        return this;
    }

    _customView(entity) {
        const content = this._executionChildren;
        if (this.tag == 'help' || this.tag == 'aide') {
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
            info: this.tag == "info",
            warning: this.tag == 'warning',
        });
    }
}

export default TextBloc;