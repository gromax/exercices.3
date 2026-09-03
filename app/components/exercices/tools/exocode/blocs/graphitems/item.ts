import JXG from 'jsxgraph'
import Bloc from "../bloc"
import Colors from '../../colors'
import MyMath from "@components/exercices/tools/maths/mymath"

abstract class GraphItem {
    protected item:Bloc
    protected _colors?:Colors
    protected _cadre:readonly [number, number, number, number]
    protected _attrToInputs:Record<string, string>
    protected _fixed:boolean = false
    protected _assignedInputs: Record<string, number> = {}
    protected _solMode:boolean = false // indique si on est en mode solution

    static readonly KNOWNS_INPUTS_ATTRIBUTES:string[] = []

    constructor(item:Bloc, cadre: [number, number, number, number], colors:Colors) {
        this.item = item
        this._colors = colors
        this._cadre = cadre
        this._assignColor('strokeColor')
        this._assignColor('color')
        this._attrToInputs = this._getAttrToInputs()
    }

    getItemParam(paramName: string): string|undefined {
        return this.item.params[paramName]
    }

    setSolMode():void {
        this._solMode = true
    }

    assignInputValue(inputNameToAssign: string, value: string): void {
        for(const [attr, inputName] of Object.entries(this._attrToInputs)) {
            if(inputNameToAssign === inputName) {
                const numberValue = parseFloat(value)
                if (isNaN(numberValue)) {
                    console.log(`Invalid number for input '${inputNameToAssign}': ${value}`)
                }
                this._assignedInputs[attr] = numberValue
                return
            }
        }
    }

    assignInputsValues(inputs: Record<string, string>): void {
        for (const attr in inputs) {
            this.assignInputValue(attr, inputs[attr])
        }
    }

    protected set_fixed() {
        this._fixed = true
    }

    inputsNames():string[] {
        return Object.values(this._attrToInputs)
    }

    isInput():boolean {
        return Object.keys(this._attrToInputs).length > 0
    }

    get name():string {
        return this.item.header
    }

    get type():string {
        return this._type
    }

    get knowns_inputs_attributes():string[] {
        return (this.constructor as typeof GraphItem).KNOWNS_INPUTS_ATTRIBUTES
    }

    abstract _type:string // nom du type d'objet
    abstract createJXGItem(g:JXG.Board, graphObjects:Record<string, JXG.GeometryElement>):JXG.GeometryElement|Record<string, JXG.GeometryElement>


    /**
     * assume que paramName est un paramètre de type couleur
     * Assigne une couleur à un paramètre donné si celui-ci est défini et est un indice numérique.
     * @param {string} paramName Le nom du paramètre de couleur à assigner.
     */
    protected _assignColor(paramName:string):void {
        if (typeof this.item.params[paramName] !== 'undefined') {
            const color = this.item.params[paramName]
            const i = parseInt(color)
            if (!isNaN(i)) {
                if (!this._colors) {
                    throw new Error(`Colors object is not defined.`)
                }
                this.item.params[paramName] = this._colors.getColor(i)
            }
        }
    }

    /**
     * Analyse une chaîne de caractères représentant une coordonnée.
     * Si la chaîne est un nombre, elle est convertie en nombre.
     * Si la chaîne est une expression, elle est analysée pour déterminer si elle dépend d'autres variables.
     * @param {string} coordString La chaîne de caractères représentant la coordonnée.
     * @returns {number|Function} La valeur numérique de la coordonnée ou une fonction si elle dépend d'une variable.
     */
    protected _parseCoord(coordString:string):number|Function {
        // Un coordonnée peut être un simple nombre
        if (/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(coordString)) {
            return Number(coordString.replace(',', '.'))
        }
        // si c'est une expression, il faut savoir si elle dépend d'autre objets
        const n = MyMath.make(coordString)
        const vars = n.variables
        if (vars.length === 0) {
            // pas de dépendance, on évalue directement
            return n.toFloat()
        }
        if ((vars.length === 1) && (vars[0].length === 1)) {
            // fonction simple
            return n.buildFunction()
        }
        return 0
    }

    /**
     * Récupère la liste des entrées (inputs) de l'élément graphique.
     * en lisant le param input qui doit être écrit sous la forme
     * <hasinputs:x->xA;y->yA/>
     * signifiant que l'attribut x est lié à l'input xA
     * et l'attribut y est lié à l'input yA
     * @returns {Record<string,string>} La liste des attributs liés aux inputs
     */
    protected _getAttrToInputs():Record<string, string> {
        // Implémentation par défaut, à surcharger dans les sous-classes si nécessaire
        if (typeof this.item.params["hasinputs"] === 'undefined') {
            return {}
        }
        const inputsString:string = this.item.params["hasinputs"]
        const inputsArray = inputsString.split(';')
        const inputs:Record<string, string> = {}
        for (const input of inputsArray) {
            if (!input.includes('->')) {
                throw new Error(`[${input} dans ${inputsString}] : L'attribut hasinputs devrait avoir la forme "attribut->nom".valid input format: ${input}`)
            }
            const [attr, inputName] = input.split('->')
            if (!this.knowns_inputs_attributes.includes(attr)) {
                throw new Error(`[${attr} dans ${inputsString}] : L'attribut n'est pas reconnu. Attributs connus: ${this.knowns_inputs_attributes.join(', ')}`)
            }
            if (inputs[attr]) {
                throw new Error(`[${attr} dans ${inputsString}] : L'attribut est déjà lié à ${inputs[attr]}.`)
            }
            if (!inputName) {
                throw new Error(`[${inputsString}] : Le nom de l'input est manquant.`)
            }
            inputs[attr] = inputName
        }
        return inputs
    }

    /**
     * Récupère la valeur actuelle de l'élément graphique associé à attribut input
     * fait le lien avec l'implémentation JXG Graph
     * @param {JXG.GeometryElement} obj L'élément graphique dont on veut récupérer la valeur.
     * @param {string} attr L'attribut dont on veut récupérer la valeur.
     * @returns {any} La valeur actuelle de l'élément graphique.
     */
    public getValue(obj:JXG.GeometryElement, attr:string): any {
        // Implémentation par défaut, à surcharger dans les sous-classes si nécessaire
        throw new Error(`L'attribut ${attr} n'est pas reconnu pour un objet de type ${this.type}`)
    }

    /**
     * Calcule le nombre de points obtenus pour cet élément graphique.
     * @returns number
     */
    calcPoint(): number {
        return 0
    }

    /**
     * Récupère les attributs nécessaires à l'initialisation des inputs
     * @param obj JXG.GeometryElement l'objet correspondant
     * @returns Record<string,any>
     */
    inputNodesNeeded(obj:JXG.GeometryElement): Record<string,string> {
        if (this._solMode) {
            return {}
        }
        return Object.fromEntries(
            Object.keys(this._attrToInputs).map(attr => [this._attrToInputs[attr], this.getValue(obj, attr)])
        )
    }

}

export default GraphItem