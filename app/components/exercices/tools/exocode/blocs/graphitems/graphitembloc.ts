import { ContentBloc } from '../contentbloc'
import { GRAPHS_KEYWORDS } from './parsegraphitem'

class GraphItemBloc extends ContentBloc {
    static readonly LABELS = GRAPHS_KEYWORDS
    static readonly NEEDS_ID = true
    static readonly HAS_PARAMS = true
    readonly identifiant: string

    constructor(tag:string, identifiant:string) {
        super(tag)
        this.identifiant = identifiant
    }

    verifyMyChildren():void {
        if (this._children.length > 0) {
            throw new Error(`Un bloc <${this.tag}> ne peut pas avoir de bloc enfant.`)
        }
    }
}

export { GraphItemBloc }