import { BlocWithView } from './contentbloc'
import { AnyView, TParams } from "@types"
import TextView from '../views/textview'
import HelpView from '../views/helpview'
import TextNode from '../simplenodes/textnode'

class TextBloc extends BlocWithView {
    static ACCEPTS_HEADER = false
    static readonly LABELS = ['text', 'texte', 'warning', 'aide', 'info', 'help']
    private _textnodes: TextNode[] = []
    private readonly _header: string

    constructor(tag:string, header:string) {
        super(tag)
        this._header = header
    }

    get isHelp():boolean {
        return this.tag === 'help' || this.tag === 'aide'
    }

    protected _getView(answers:Record<string, string>):AnyView {
        if (this.isHelp) {
            return new HelpView({
                subtitle: this._header || this._params["subtitle"] || false,
                paragraphs: this._textnodes,
            })
        }
        
        return new TextView({
            header: this._header || false,
            subtitle: this._params["subtitle"] || false,
            paragraphs: this._textnodes,
            footer: this._params["footer"] || false,
            info: this.tag === "info",
            warning: this.tag === 'warning',
        })
    }

    verifyMyChildren():void {
        this._textnodes = this._children.filter(
            (child) => child instanceof TextNode
        )
        if (this._children.some((child) => !(child instanceof TextNode))) {
            throw new Error(`Un bloc <${this.tag}> ne peut contenir que du texte.`)
        }
    }
}

export default TextBloc