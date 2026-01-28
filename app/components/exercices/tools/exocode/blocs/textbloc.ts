import Bloc from './bloc.js'
import { View } from 'backbone.marionette'
import TextView from '../views/textview.js';
import HelpView from '../views/helpview.js';

type AnyView = View<any>|Array<View<any>>

class TextBloc extends Bloc {
    static readonly LABELS = ['text', 'texte', 'warning', 'aide', 'info', 'help'];
    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false);
    }

    run(params:Record<string, any>, caller:any):this {
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

    isHelp():boolean {
        return this.tag === 'help' || this.tag === 'aide';
    }

    protected _getView(answers:Record<string, string>):AnyView {
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