import _ from "underscore"
import Bloc from './bloc.js'
import { AnyView, NestedInput } from "@types"
import TableView from '../views/tableview'

class TableBloc extends Bloc {
    static readonly LABELS = ['table']
    private _rows?:Array<Array<string>>
    private _rowheaders?:Array<string>
    private _colheaders?:Array<string>

    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
    }

    protected _verifParam(name:string, value:NestedInput):void {
        const hasBrackets = name.endsWith('[]')
        if (hasBrackets) {
            name = name.slice(0,-2)
        }
        if (!hasBrackets) {
            if (!Array.isArray(value)) {
                throw new Error(`<${name}> vous devriez soit mettre <${name}[]: soit donner un tableau`)
            }
            const newVal = _.flatten(value).map(item => String(item))
            if (name === "rowheaders") {
                this._rowheaders = newVal
            } else {
                this._colheaders = newVal
            }
            return 
        }
        if (Array.isArray(value)) {
            throw new Error(`<${name}[]> vous devriez soit mettre <${name}: soit donner un item simple (pas un tableau)`)
        }
        const newVal = String(value)
        if (name === "rowheaders") {
            if (typeof this._rowheaders === "undefined") {
                this._rowheaders = [newVal]
            } else {
                this._rowheaders.push(newVal)
            }
        } else {
            if (typeof this._colheaders === "undefined") {
                this._colheaders = [newVal]
            } else {
                this._colheaders.push(newVal)
            }
        }
    }

    setParam(key:string, value:NestedInput):void {
        if (/^(rowheaders|colheaders)(\[\])?$/.test(key)) {
            this._verifParam(key, value)
            return
        }
        if (key === "rows") {
            throw new Error("<rows: ajoutez les lignes une par une avec <rows[]:")
        }
        if (key === "rows[]") {
            if (!Array.isArray(value)) {
                throw new Error("<rows[]: le paramètre devrait être un tableau")
            }
            if (typeof this._rows === "undefined") {
                this._rows = []
            }
            this._rows.push(_.flatten(value).map(item => String(item)))
            return
        }
        super.setParam(key, value)
    }

    protected _getView(answers:Record<string, string>):AnyView {
        return new TableView({
            rows: this._rows || [],
            rowheaders: this._rowheaders || null,
            colheaders: this._colheaders || null
        })
    }
}

export default TableBloc