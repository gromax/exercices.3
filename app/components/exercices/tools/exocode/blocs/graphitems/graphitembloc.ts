import Bloc from '../bloc'
import { GRAPHS_KEYWORDS } from './parsegraphitem'

class GraphItemBloc extends Bloc {
    static readonly LABELS = GRAPHS_KEYWORDS

    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
    }
}

export { GraphItemBloc }