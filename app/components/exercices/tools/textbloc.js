import Bloc from './bloc.js';
import TextNode from './textnode.js';
import { TextView, HelpView } from '../run/views.js';

class TextBloc extends Bloc {
    static LABELS = ['text', 'texte', 'warning', 'aide', 'info', 'help'];
    constructor(tag, paramsString, closed) {
        super(tag, paramsString, closed);
        this._category = 'text';
    }

    run(params) {
        if (this._executionChildren) {
            // déjà exécuté
            return this;
        }
        super.run(params);
        // pour un bloc de texte ne conserve que le texte
        this._executionChildren = this._executionChildren.filter(item => item instanceof TextNode);
        return this;
    }

    toView(params) {
        this.run(params);
        const content = this._executionChildren.map(item => item.text).join('\n').split('\n\n');

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