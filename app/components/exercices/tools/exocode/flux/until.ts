import Bloc from "../blocs/bloc"
import Node from "../node"
import LogicalNode from "./logicalnode"
import parseExpression from "./logicalparser"
import { InputType } from "@types"
import IfBloc from "./ifbloc"
import Affectation from "../affectation"

class Until extends Bloc {
    static MAXITERATIONS = 100
    private _counter:number
    private _expression:LogicalNode

    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
        this._counter = 0
        this._expression = parseExpression(paramsString);
    }
    
    toString():string {
        return `<until ${this._expression.toString()} ${this.closed ? '' : '*'}>`;
    }

    push(child:Node) {
        if (this.closed) {
            throw new Error("Impossible d'ajouter un enfant à un bloc fermé");
        }
        // until ne peut avoir que des affectations comme enfants
        if (!(child instanceof Affectation) && !(child instanceof IfBloc)) {
            throw new Error("Un bloc <until> ne peut contenir que des affectations et des If.");
        }
        this._children.push(child);
    }

    run(params:Record<string,InputType>, caller:any):Array<Node> {
        // renvoie les enfants et le until ensuite en incrémentant le compteur
        this._counter += 1
        if (this._counter > Until.MAXITERATIONS) {
            throw new Error(`<until> MAXITERATIONS = ${Until.MAXITERATIONS} dépassé.`)
        }
        if (this._expression.evaluate(params)) {
            return []
        }
        const children = [...this._children]
        children.push(this)
        return children
    }
}

export default Until