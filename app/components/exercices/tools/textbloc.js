import Bloc from './bloc.js';
import { TextView } from '../run/views.js';

class TextBloc extends Bloc {
    static LABELS = ['text', 'texte', 'warning', 'aide', 'info'];
    constructor(label, paramsString, closed) {
        super('text', paramsString, closed);
        this.setParam('type', label);
    }

    get label() {
        return this._params["type"];
    }

    toView(params, options) {
        const result = this.run(params, options);
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