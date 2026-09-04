import GraphItem from "./item"
import JXG from 'jsxgraph'
import _ from "underscore"
import MyMath from "../../../maths/mymath"

class GraphPoint extends GraphItem {
    _type = 'Point'
    _fixed = false
    _isGood?: boolean
    protected _isGoodassignedInputs: Record<string, number> = {}
    static readonly KNOWNS_INPUTS_ATTRIBUTES = ["x", "y"]
    public createJXGItem(g:JXG.Board, graphObjects:Record<string, any>):JXG.GeometryElement|Record<string, JXG.GeometryElement> {
        const x = this._assignedInputs["x"] || this._parseCoord(this.item.params.x || '0')
        const y = this._assignedInputs["y"] || this._parseCoord(this.item.params.y || '0')
        const options = _.pick(this.item.params, ['name', 'size', 'color', 'fixed'])
        if (this._fixed || this.isInput() && this._solMode) {
            // ce paramètre est prioritaire sur celui passé dans les options
            options.fixed = true
        }
        if (this.item.params.solution == "true" && !this._solMode && !this.isInput()) {
            options["visible"] = false
        }
        const [typeElement, attr] = this._calcCible(x, y, this.item.params.on, graphObjects)
        const point = g.create(typeElement, attr, options) as JXG.GeometryElement
        const name = point.getName()
        if (this._isGood === true) {
            point.setAttribute({
                label: {
                    strokeColor: 'green',
                }
            } as JXG.PointAttributes)
            point.label.setText(`${name} ✓`)
        } else if (this._isGood === false) {
            point.setAttribute({
                label: {
                    strokeColor: 'red',
                }
            } as JXG.PointAttributes)
            point.label.setText(`${name} ✗`)
        }
        if (!this._fixed && !this._solMode && this.isInput()) {
            this._connect_inputs(point)
        }

        const goodPointCoords = this._goodPointCoords()
        if (this._isGood === false && goodPointCoords) {
            // on crée un 2e point pour représenter la position correcte
            const goodOptions = {
                ...options,
                color:"green",
                "fixed":true,
                "name": `${name} ✓`,
                "label": {
                    strokeColor: 'green',
                } 
            } as JXG.PointAttributes
            const [typeElementG, attrG] = this._calcCible(goodPointCoords[0], goodPointCoords[1], this.item.params.on, graphObjects)
            const goodPoint = typeElementG === "glider"
                ? g.create("glider", attrG, goodOptions)
                : g.create("point", attrG, goodOptions)
            return {
                [this.name]: point,
                [this.name + " ✓"]: goodPoint
            }
        }
        return point
    }

    private _calcCible(x:number|Function, y:number|Function, paramOn:string|undefined, graphObjects:Record<string, any>): ['point'|'glider',any[]] {
        if (paramOn && !graphObjects[paramOn]) {
            throw new Error(`L'objet graphique '${paramOn}' n'existe pas.`)
        }
        if (paramOn) {
            return ["glider", [x, y, graphObjects[paramOn]]] 
        } else {
            return ["point", [x,y]]
        }
    }

    /**
     * attache à l'objet graphique un événement qui modifie les inputs
     * @param obj JXG.GeometryElement
     */
    protected _connect_inputs(obj:JXG.GeometryElement):void {
        const inputs = this._getAttrToInputs()
        const item = this
        obj.on("up", function() {
            for (const [attr, inputName] of Object.entries(inputs)) {
                const newValue = item.getValue(obj, attr)
                const inputElement = document.querySelector(`input[name="${inputName}"]`) as HTMLInputElement | null
                if (inputElement) {
                    inputElement.value = newValue
                }
            }
        })
    }

    /**
     * empêche un l'élément de se confondre avec un autre
     */
    setDistinct(JXG_Objects: Record<string, JXG.GeometryElement>): void {
        if (!this.item.params.distinct) {
            return
        }
        if (!JXG_Objects[this.name]) {
            return
        }
        const obj = JXG_Objects[this.name]
        if (!(obj instanceof JXG.Point)) {
            return
        }
        const distinct = this.item.params.distinct
        const tolerance = distinct.includes(";") ? parseFloat(distinct.split(";")[1]) : 1
        const namesString:string = distinct.includes(";") ? distinct.split(";")[0] : distinct
        const names:Array<string> = namesString.split(",").map((name: string) => name.trim())
        const objectsToAvoid = names.map((name:string) => JXG_Objects[name]).filter(obj => obj && (obj instanceof JXG.Point))
        const tol2 = tolerance**2
        
        obj.on("drag", function() {
            for (const other of objectsToAvoid) {
                if ((other === obj)|| !(other instanceof JXG.Point)) continue
                const dx = obj.X() - other.X()
                const dy = obj.Y() - other.Y()
                const distance = Math.sqrt(dx*dx + dy*dy)
                if (distance === 0) {
                    obj.moveTo([other.X() + tolerance, other.Y()])
                }
                if (distance < tol2) {
                    obj.moveTo([other.X() + dx/distance*tolerance, other.Y() + dy/distance*tolerance])
                }
            }

        })
    }

    /**
     * Récupère la valeur actuelle de l'élément graphique associé à attribut input
     * fait le lien avec l'implémentation JXG Graph
     * @param {JXG.GeometryElement} obj L'élément graphique dont on veut récupérer la valeur.
     * @param {string} attr L'attribut dont on veut récupérer la valeur.
     * @returns {any} La valeur actuelle de l'élément graphique.
     */
    public getValue(obj:JXG.GeometryElement, attr:string): any {
        if (!(obj instanceof JXG.Point)) {
            throw new Error(`L'objet n'est pas un point.`)
        }
        if (attr === 'x') {
            return obj.X()
        }
        if (attr === 'y') {
            return obj.Y()
        }
        throw new Error(`L'attribut ${attr} n'est pas reconnu pour un objet de type ${this.type}`)
    }

    protected _goodPointCoords(): [number, number, number]|undefined {
        const good = this.item.params["good"]
        if (typeof good == "undefined") {
            return undefined
        }
        const regex =  /^\(\s*(-?\d+(?:[.,]\d+)?)\s*;\s*(-?\d+(?:[.,]\d+)?)(?:\s*;\s*(-?\d+(?:[.,]\d+)?))?\s*\)$/
        const match = good.match(regex)
        if (match) {
            // On a une coordonnée
            const [, first, second, third] = match
            const x = parseFloat(first.replace(',', '.'))
            const y = parseFloat(second.replace(',', '.'))
            const tolerance = third ? parseFloat(third.replace(',', '.')) : 0.1
            return [x,y,tolerance]
        }
        return undefined
    }

    protected _calcIsGood(): void {
        if (typeof this._isGood !== 'undefined') {
            // déjà fait
            return
        }
        const good = this.item.params["good"]
        if (typeof good == "undefined") {
            console.warn(`Le paramètre "good" de ${this.name} n'est pas défini`)
            this._isGood = true
            return
        }

        const goodPointCoords = this._goodPointCoords()
        if (goodPointCoords) {
            // On a une coordonnée
            const [x, y, tolerance] = goodPointCoords
            if (isNaN(x) || isNaN(y) || isNaN(tolerance)) {
                console.warn(`Le paramètre "good" de ${this.name} n'est pas correctement formaté: ${this.item.params["good"]}`)
                this._isGood = true
                return
            }
            const xAnswer = this._assignedInputs['x'] ?? x
            const yAnswer = this._assignedInputs['y'] ?? y
            this._isGood = ((xAnswer - x)**2 + (yAnswer-y)**2 <= tolerance**2)
            return
        }
        const tolerance = good.includes(';')?parseFloat(good.split(';')[1].replace(',', '.')):0.1
        const expression = good.includes(';')?MyMath.make(good.split(';')[0]):MyMath.make(good)
        for (const v of expression.variables) {
            if (!["x", "y"].includes(v)) {
                console.warn(`La variable "${v}" dans le paramètre "good":${good} de ${this.name} n'est pas reconnue`)
                this._isGood = true
                return
            }
        }
        const result =expression.subs({
            x: this._assignedInputs['x'] ?? 0,
            y: this._assignedInputs['y'] ?? 0
        }).toFloat()
        this._isGood = Math.abs(result) <= tolerance
    }


    /**
     * Calcule le nombre de points obtenus pour cet élément graphique.
     * @returns number
     */
    calcPoint(): number {
        if (!this.isInput()) {
            return 0
        }
        this._calcIsGood()
        return this._isGood ? 1 : 0
    }
}

export default GraphPoint