import { ContentBloc } from '../bloc'
import { GRAPHS_KEYWORDS } from './parsegraphitem'

class GraphItemBloc extends ContentBloc {
    static readonly LABELS = GRAPHS_KEYWORDS
    readonly HAS_PARAMS = true

    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
    }

    verifyMyChildren():void {
        if (this._children.length > 0) {
            throw new Error(`Un bloc <${this.tag}> ne peut pas avoir de bloc enfant.`)
        }
    }
}

export { GraphItemBloc }