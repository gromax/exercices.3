import Bloc from './bloc.js';
import { TextView, HelpView } from '../run/views.js';

class TextBloc extends Bloc {
    static LABELS = ['text', 'texte', 'warning', 'aide', 'info', 'help'];
    constructor(label, paramsString, closed) {
        super('text', paramsString, closed);
        this.setParam('type', label);
    }

    get label() {
        return this._params["type"];
    }

    toView(params, options) {
        const result = this.run(params, options);
        if (this.label == 'help' || this.label == 'aide') {
            return new HelpView({
                subtitle: this._params["header"] || this._params["subtitle"] || false,
                paragraphs: result.content,
            });
        }
        return new TextView({
            header: this._params["header"] || false,
            subtitle: this._params["subtitle"] || false,
            paragraphs: result.content,
            footer: this._params["footer"] || false,
            info: this.label == "info",
            warning: this.label == 'warning',
        });
    }
}

export default TextBloc;