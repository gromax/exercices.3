import Bloc from './bloc.js'
import { AnyView, TParams } from "@types"
import TextView from '../views/textview'
import HelpView from '../views/helpview'
import TextNode from '../textnode'

class TextBloc extends Bloc {
    static readonly LABELS = ['text', 'texte', 'warning', 'aide', 'info', 'help']
    protected _text:Array<string> = []

    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
    }

    run(params:TParams):this {
        if (this._runned) {
            // déjà exécuté
            return this
        }
        super.run(params)
        // pour un bloc de texte ne conserve que le texte
        this._text = this._children.filter(
            (child): child is TextNode => child instanceof TextNode
        ).map(
            child => child.text
        )
        return this
    }

    get text():Array<string> {
        return this._text
    }

    get isHelp():boolean {
        return this.tag === 'help' || this.tag === 'aide'
    }

    protected _getView(answers:Record<string, string>):AnyView {
        const content = this._children
        if (this.isHelp) {
            return new HelpView({
                subtitle: this._params["header"] || this._params["subtitle"] || false,
                paragraphs: content,
            })
        }
        
        return new TextView({
            header: this._params["header"] || false,
            subtitle: this._params["subtitle"] || false,
            paragraphs: content,
            footer: this._params["footer"] || false,
            info: this.tag === "info",
            warning: this.tag === 'warning',
        })
    }
}

export default TextBloc