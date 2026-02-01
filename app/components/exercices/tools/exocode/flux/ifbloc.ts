import Bloc from '../blocs/bloc'
import parseExpression from './logicalparser'
import LogicalNode from './logicalnode'
import { Node } from "../node"
import { TParams } from "@types"


class IfBloc extends Bloc {
    static readonly END = '<endif>'
    static readonly ENDIF = 'endif'
    static readonly IF = 'if'
    static readonly ELIF = 'elif'

    private _ifClosed:boolean = false
    private _elseChildren:Array<Node> = []
    private _expression:LogicalNode

    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
        this._expression = parseExpression(paramsString)
    }

    closeIfBranch():void {
        if (this.tag !== IfBloc.IF && this.tag !== IfBloc.ELIF) {
            throw new Error("Seuls les blocs if et elif peuvent être fermés avec une branche else");
        }
        if (this._ifClosed) {
            throw new Error("La branche if est déjà fermée. Vérifiez l'enchaînement de vos if, elif, else.");
        }
        this._ifClosed = true;
    }

    closeIfNecessary(previous:any) {
        if (this.tag === IfBloc.IF) {
            return
        }
        if (!(previous instanceof IfBloc)) {
            throw new Error("<elif> non précédé par <if> ou <elif>")
        }
        previous.closeIfBranch()
    }

    private _evaluateCondition(params:TParams):boolean {
        if (!this._expression) {
            return true;
        }
        const evaluation = this._expression.evaluate(params)
        if (Array.isArray(evaluation)) {
            throw new Error("<if> : La condition ne devrait pas renvoyer un tableau")
        }
        return evaluation
    }

    push(child:Node):void {
        if (this.closed) {
            throw new Error("Impossible d'ajouter un enfant à un bloc fermé");
        }
        if (this._ifClosed) {
            this._elseChildren.push(child);
        } else {
            this._children.push(child);
        }
    }

    toString():string {
        let out = `<${this.tag} ${this._expression?this._expression.toString():''} ${this.closed ? '' : '*'}>`;
        for (const child of this._children) {
            out += `\n  ${child.toString().replace(/\n/g, '\n  ')}`;
        }
        if (this._elseChildren.length > 0) {
            out += `\n<else>`;
            for (const child of this._elseChildren) {
                out += `\n  ${child.toString().replace(/\n/g, '\n  ')}`;
            }
        }
        out += `\n${IfBloc.END}`;
        return out;
    }

    run(params:TParams):Array<Node> {
        const result = this._evaluateCondition(params);
        const ifChildren = result ? this._children : this._elseChildren;
        return ifChildren;
    }
}

export default IfBloc