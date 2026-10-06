/*
Classe pour gérer une validation de saisie utilisateur
*/

import { InputType } from "@components/types"

abstract class AbsChecker {
    /** @param {string} _expr Expression testée, par ex celle de l'utilisateur */
    protected _expr: string
    
    /** @param{boolean} _formatValid Indique si le format de l'expression est valide */
    protected _formatValid?:boolean
    
    /** @param {string} _message Message d'erreur si le format n'est pas valide */
    protected _message:string
    
    /** @param {string} _format Format attendu pour l'expression */
    protected _format:string

    /**
     * constructeur
     * @param {string} expr Expression saisie par l'utilisateur
     * @param {string} format Format attendu pour l'expression, par défaut vide
     */
    constructor(expr:string, format:string = "") {
        this._expr = expr.trim()
        this._message = ""
        this._format = format
    }

    /**
     * Teste si le format correspond au checker
     * @param {string} format format testé
     * @returns {boolean} Vrai si le format est celui attendu
     */
    static testFormat(format:string):boolean {
        throw new Error("AbsChecker.testFormat ne devrait pas être appelé")
    }

    /**
     * Teste si l'expression fournie par l'utilisateur vérifie le format attendu
     * @returns {boolean} Vrai si le format est valide, faux sinon
     */
    protected abstract _testFormat():boolean

    /**
     * getter mettant en cache le résultat du test de format
     * et renvoyant cette valeur.
     * @returns {boolean} Vrai si le format est valide, faux sinon
     */
    get formatIsValid():boolean {
        if (typeof this._formatValid == "undefined") {
            this._formatValid = this._testFormat()
        }
        return this._formatValid
    }

    /**
     * Convertit l'expression au format attendu
     * Utile pour adapter l'expression solution au format attendu
     * @returns {string} Expression convertie au format attendu
     */
    abstract toFormat():string

    /**
     * Teste si la valeur de l'expression est correcte par rapport à la valeur attendue
     * @param {InputType} expected Valeur attendue
     * @returns {boolean} Vrai si la valeur est correcte, faux sinon
     */
    abstract valueIsGood(expected:InputType):boolean

    /**
     * Retourne le nom du checker
     * @returns {string} Nom du checker
     */
    abstract name():string

    /**
     * Teste si le format de la valeur attendue est valide
     * @param {InputType} expected Valeur attendue
     * @returns {boolean} Vrai si le format est valide, faux sinon
     */
    abstract testExpectedFormat(expected:InputType):boolean

    /**
     * Teste si la valeur de l'expression est exclue par rapport à la valeur attendue
     * @param {InputType} excluded Valeur exclue
     * @returns {boolean} Vrai si la valeur est exclue, faux sinon
     */
    valueIsExcluded(excluded: InputType): boolean {
        return this.valueIsGood(excluded)
    }

    /**
     * Message associé à l'expression
     * @returns {string} Message associé à l'expression
     */
    get message():string {
        return this._message
    }

    /**
     * Format attendu pour l'expression
     * @returns {string} Format attendu pour l'expression
     */
    get format():string {
        return this._format
    }

    /**
     * Expression courante
     * @returns {string} Expression courante
     */
    get expression():string {
        return this._expr
    }

    /**
     * nom standardisé du format
     * @returns {string} Nom standardisé du format
     */
    static standardName():string {
        throw new Error("Méthode standardName() non implémentée")
    }

}

export { AbsChecker }