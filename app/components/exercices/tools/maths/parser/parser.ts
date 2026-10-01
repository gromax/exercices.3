import _ from 'underscore'

import { Token } from './tokens/token'
import { TNumber } from './tokens/number'
import { TFunction } from './tokens/function'
import { TOperator } from './tokens/operator'
import { TParenthesis } from './tokens/parenthesis'
import { TSymbol } from './tokens/symbol'
import { TEnsemble } from './tokens/ensemble'

import { build, buildEnsemble } from './rpnbuilder'
import { Scalar } from "../number/scalar"
import { Base} from "../number/base"
import type { Ensemble } from "../number/ensemblesitems/parent"


const TOKENS = [TNumber, TFunction, TOperator, TParenthesis, TSymbol]
const TOKENS_INTERVAL = [...TOKENS,TEnsemble]
import type { TBuildOptions } from '@types'

class Parser {
    /** @type{string} */
    private _saisie:string

    /** @type{TBuildOptions} */
    private _mode:TBuildOptions

    static REGEX = new RegExp (
        _.map(
            TOKENS,
            (tok) => `(${tok.getRegexString()})`
        ).join("|"),
        "gi"
    )

    static REGEX_INTERVAL = new RegExp (
        _.map(
            TOKENS_INTERVAL,
            (tok) => `(${tok.getRegexString()})`
        ).join("|"),
        "gi"
    )

    /**
     * construit un objet Parser et parse la saisie
     * @param {string} expr 
     * @returns {Parser}
     */
    static build(expr:string|number, mode:TBuildOptions = "default"): Base {
        if (mode === "interval") {
            throw new Error("`build ne devrait pas être appelé avec le mode interval.")
        }
        if (typeof expr === "number") {
            return new Scalar(expr)
        }
        if (typeof expr !== "string") {
            expr = String(expr)
        }
        const parser = new Parser(expr, mode)
        return parser.base
    }

    /**
     * @param {string} expr L'expression à parser
     * @returns {Ensemble} L'ensemble construit à partir de l'expression
     */
    static buildEnsemble(expr:string): Ensemble {
        if (typeof expr !== "string") {
            expr = String(expr)
        }
        const parser = new Parser(expr, "interval")
        return parser.ensemble
    }

    /**
     * constructeur
     * @param {string} saisie
     */
    private constructor(saisie:string, mode:TBuildOptions = "default") {
        this._saisie = saisie || ""
        this._mode = mode
    }

    get base(): Base {
        return this._parseToBase(this._saisie)
    }

    get ensemble(): Ensemble {
        return this._parseToEnsemble(this._saisie)
    }

    /**
     * construit un token
     * @param {string} tokenString
     * @returns {Token}
     */
    private _createToken(tokenString:string): Token {
        const oTokens = this._mode === "interval" ? TOKENS_INTERVAL : TOKENS
        for (let oToken of oTokens) {
            if (oToken.test(tokenString)) {
                return new oToken(tokenString)
            }
        }
        throw new Error(`${tokenString} n'est pas valide.`)
    }

    /**
     * modifie les opérateurs + ou - qui n'ont pas une opérande sur leur gauche
     * @param {Array<Token>} tokensList Liste des tokens à corriger
     */
    private _correctBinaireToUnaire(tokensList:Array<Token>): void {
        for (let i=0; i<tokensList.length; i++) {
            const oToken = tokensList[i]
            const leftIsNotOperand = ((i==0) || !tokensList[i-1].acceptOperOnRight());
            if ((oToken instanceof TOperator) && (oToken.operateOnLeft()) && leftIsNotOperand && !oToken.changeToArityOne()){
                throw new Error(`${oToken} devrait avoir potentiellement une opérande sur sa gauche`);
            }
        }
    }

    /**
     * vérifie si les parenthèses sont équilibrées, lance une erreur sinon
     * @param {Array<Token>} tokens Liste des tokens à vérifier
     * @returns {void}
     */
    private _verifyParentheses(tokens:Array<Token>):void {
        let ouvrants:Array<string> = [];
        for (let tok of tokens) {
            if (tok instanceof TParenthesis) {
                if (tok.ouvrant) {
                    ouvrants.push(tok.symbol)
                    continue;
                }
                if (ouvrants.length == 0) {
                    throw new Error(`${tok.symbol} n'a pas d'ouvrant.`)
                }
                let ouvrant = ouvrants.pop()
                if (ouvrant != tok.jumeau) {
                    throw new Error(`${ouvrant} fermé par ${tok.jumeau}.`)
                }
            }
        }
        if (ouvrants.length != 0) {
            throw new Error(`${ouvrants.pop()} n'a pas de fermant.`)
        }
    }

    /**
     * transforme les frac A B en A / B
     * @param {Array<Token>} tokens Liste de tokens
     * @returns {Array<Token>} tokens corrigés
     */
    private _correctFracs(tokens:Array<Token>): Array<Token> {
        let correctedTokens:Array<Token> = []
        let depthsFracs:Array<number> = []
        let depth = 0
        for (let token of tokens){
            if ((token instanceof TParenthesis) && token.ouvrant) {
                depth += 1
                correctedTokens.push(token)
                continue
            }
            if (String(token) == "frac") {
                depthsFracs.push(depth)
                continue
            }
            if ((token instanceof TParenthesis) && token.fermant) {
                depth -= 1;
                if (depth <0) {
                    throw new Error('frac: parenthèses mal équilibrées.')
                }
            }
            correctedTokens.push(token)
            if ((depthsFracs.length>0) && (depthsFracs[depthsFracs.length-1] == depth)) {
                depthsFracs.pop();
                correctedTokens.push(new TOperator('/'))
            }
        }
        if (depth>0) {
            throw new Error('frac: parenthèses mal équilibrées.')
        }
        if (depthsFracs.length>0) {
            throw new Error("frac: certains fracs manquent d'opérandes.")
        }
        return correctedTokens
    }

    /**
     * vérifie si les opérateurs agissent comme il se doit à gauche et à droite, lance une erreur sinon
     * @param {Array<Token>} tokens
     * @returns {void}
     */
    private _verifyOperators(tokens:Array<Token>): void {
        for (let i=0; i<tokens.length; i++) {
            let tok = tokens[i]
            if (tok.operateOnLeft()) {
                if (i==0) {
                    throw new Error(`${tok} en début d'expression.`)
                }
                if (!tokens[i-1].acceptOperOnRight()) {
                    throw new Error(`${tokens[i-1]} à gauche de ${tok}.`)
                }
            }
            if (tok.operateOnRight()) {
                if (i==tokens.length-1) {
                    throw new Error(`${tok} en fin d'expression.`)
                }
                if (!tokens[i+1].acceptOperOnLeft()) {
                    throw new Error(`${tok} à gauche de ${tokens[i+1]}.`)
                }
            }
        }
    }

    /**
     * @param {Array<Token>} tokens Liste des tokens à convertir en RPN
     * @returns {Array<Token>} pile en notation polonaise inversée
     */
    private _buildRpn(tokens:Array<Token>): Array<Token> {
        const rpn:Array<Token> = []
        const stack:Array<Token> = []
        for(let token of tokens) {
            if ((token instanceof TParenthesis) && token.ouvrant) {
                stack.push(token)
                continue
            }
            if (token instanceof TParenthesis) { // fermant
                while (stack.length>0) {
                    const depile = stack.pop()
                    if (depile instanceof TParenthesis) {
                        break
                    }
                    rpn.push(depile)
                }
                continue;
            }
            if (token.priority == 0) {
                rpn.push(token)
                continue
            }
            while (stack.length > 0) {
                const depile = stack[stack.length - 1]
                if ((depile instanceof TParenthesis) || depile.priority < token.priority) {
                    break
                }
                rpn.push(stack.pop()!)
            }
            stack.push(token)
        }            
        while (stack.length > 0) {
            const depile = stack.pop()
            if (!(depile instanceof TParenthesis)) {
                rpn.push(depile!)
            }
        }
        return rpn
    }

    /**
     * renvoie la liste de tokens avec les * manquants
     * @param {Array<Token>} tokens liste de tokens
     * @return {Array<Token>} liste corrigée
     */
    private _insertMissingMults(tokens:Array<Token>): Array<Token> {
        let correctedTokens = []
        let n = tokens.length
        for (let i=0; i<n-1; i++) {
            correctedTokens.push(tokens[i])
            if (tokens[i].acceptOperOnRight() && tokens[i+1].acceptOperOnLeft()) {
                correctedTokens.push(new TOperator('*'))
            }
        }
        if (n > 0) {
            correctedTokens.push(tokens[n-1])
        }
        return correctedTokens
    }

    /**
     * renvoie, s'il existe, le premier caractère non tokenizé, sinon null
     * @param {string} expression
     * @param {Array} tokens
     * @returns {string|null} Le premier caractère non tokenizé, ou null si tous les caractères sont reconnus.
     */
    private _charNotTokenized(expression:string, tokens:Array<string>): string|null {
        // Vérifier qu'il n'y a pas de caractères non reconnus
        const expressionSansEspaces = expression.replace(/\s+/g, "")
        const tokensReconstitues = tokens.join("")
        if (expressionSansEspaces !== tokensReconstitues) {
            // Trouver le premier caractère problématique
            for (let i=0; i<expressionSansEspaces.length; i++) {
                if (i>=tokensReconstitues.length || expressionSansEspaces[i] !== tokensReconstitues[i]) {
                    return expressionSansEspaces[i]
                }
            }
        }
        return null
    }

    /**
     * Sanityse l'expression en corrigeant certains caractères et formats courants
     * @param {string} expression
     * @returns {string}
     */
    private _sanityseExpression(expression:string): string {
        if (expression.includes('.') && expression.includes(',')) {
            console.warn("Utilisez soit le point soit la virgule comme séparateur décimal, pas les deux.")
            //throw new Error("Utilisez soit le point soit la virgule comme séparateur décimal, pas les deux.")
        }

        // Pour ceux qui écriraient ** au lieu de ^ comme en Python
        expression = expression.replaceAll("**", "^")
        // correction des  \left et \right qui serait présent dans un champs de saisie latex
        expression = expression.replace(/\\\\/g, " ")
        expression = expression.replace(/left/g, " ")
        expression = expression.replace(/right/g, " ")
        // Les élèves utilisent la touche ²
        expression = expression.replace(/²/g, "^2 ")
        expression = expression.replace(/³/g, "^3 ")
        // Dans certains cas, le - est remplacé par un autre caractère plus long
        expression = expression.replace(/−/g, "-")
        return expression.trim()
    }

    /**
     * Vérifie qu'il n'y a pas de caractères non tokenizés dans l'expression.
     * Lance une erreur si un caractère non reconnu est trouvé.
     * @param {string} expression
     * @param {Array} tokens
     * @returns {void}
     */
    private _verifyNotTokenized(expression:string, tokens:Array<string>): void {
        const notTokenizedChar = this._charNotTokenized(expression, tokens)
        if (notTokenizedChar !== null) {
            if (notTokenizedChar === '.' || notTokenizedChar === ',') {
                throw new Error(`Séparateur décimal isolé : '${notTokenizedChar}'. Vérifiez.`)
            } else {
                throw new Error(`Caractère non reconnu : '${notTokenizedChar}'.`)
            }
        }
    }

    /**
     * Corrige certains problèmes courants dans la liste de tokens.
     * @param {Array<Token>} tokensList La liste de tokens à corriger
     * @returns {Array<Token>} La liste de tokens corrigée
     */
    private _sanityseTokenList(tokensList: Array<Token>): Array<Token> {
        // Implémenter ici les corrections nécessaires sur la liste de tokens
        this._correctBinaireToUnaire(tokensList)
        this._verifyParentheses(tokensList)
        tokensList = this._correctFracs(tokensList)
        tokensList = this._insertMissingMults(tokensList)
        this._verifyOperators(tokensList)
        return tokensList
    }

    /**
     * parse la chaîne fournie, renvoie le nombre sous forme d'objet Base
     * @param {string|undefined} inExpression L'expression à analyser
     * @returns {Base} Le nombre sous forme d'objet Base
     */
    private _parseToBase(inExpression?:string):Base {
        const expression = inExpression
            ? this._sanityseExpression(inExpression)
            : this._sanityseExpression(this._saisie)
        const matchList = expression.match(Parser.REGEX)
        if (!matchList) {
            throw new Error("Aucun item valide reconnu !")
        }
        
        // Vérifier qu'il n'y a pas de caractères non reconnus
        this._verifyNotTokenized(expression, matchList)

        const tokensList: Array<Token> = []
        for (let strToken of matchList) {
            const token = this._createToken(strToken);
            if (token === null) {
                throw new Error(`Token non reconnu : '${strToken}'.`)
            }
            tokensList.push(token)
        }
        const stokensList = this._sanityseTokenList(tokensList)
        return build(this._buildRpn(stokensList), this._mode == "complex")
    }

    /**
     * Analyse l'expression comme intervalle
     * Analyse l'expression comme intervalle et renvoie la liste de tokens en notation polonaise inversée (RPN)
     * @param {string} inExpression L'expression à analyser
     * @returns {Ensemble} L'ensemble produit
     */
    private _parseToEnsemble(inExpression:string):Ensemble {
        const expression = this._sanityseExpression(inExpression)
        const matchList = expression.match(Parser.REGEX_INTERVAL)
        if (!matchList) {
            throw new Error("Aucun item valide reconnu !")
        }
        
        // Vérifier qu'il n'y a pas de caractères non reconnus
        this._verifyNotTokenized(expression, matchList)

        const tokensList: Array<Token> = []
        for (let strToken of matchList) {
            const token = this._createToken(strToken)
            if (token === null) {
                throw new Error(`Token non reconnu : '${strToken}'.`)
            }
            tokensList.push(token)
        }

        // nous avons maintenant une liste de tokens qui contient peut être des items intervalles
        // il va falloir le traiter

        // On commence par identifier les ] [ des intervalles
        let startIntervalle = _.findIndex(
            tokensList,
            (token) => (token instanceof TEnsemble) && token.isBracket
        )
        while (startIntervalle !== -1) {
            // Traiter l'intervalle trouvé
            const stopIntervalle = _.findIndex(
                tokensList,
                (token, index) => index > startIntervalle && (token instanceof TEnsemble) && token.isBracket,
                startIntervalle+1
            )
            if (stopIntervalle === -1) {
                throw new Error(`<${this._saisie}> l'intervalle ouvert n'est pas refermé !`)
            }
            const opening = tokensList[startIntervalle]
            const closing = tokensList[stopIntervalle]
            const tokenInterval = new TEnsemble(`${opening}${closing}`)
            const children = tokensList.slice(startIntervalle + 1, stopIntervalle)
            const sChildren = this._sanityseTokenList(children)
            const childrenRpn = this._buildRpn(sChildren)
            tokenInterval.setSubTokensList(childrenRpn)
            tokensList.splice(startIntervalle, stopIntervalle - startIntervalle + 1, tokenInterval)
            
            startIntervalle = _.findIndex(
                tokensList,
                (token) => (token instanceof TEnsemble) && token.isBracket
            )
        }
        // à ce stade les intervalles sont renfermés comme des nœuds uniques dans la liste des tokens
        // On peut traiter maintenant la liste des tokens nomalement
        this._verifyParentheses(tokensList)
        this._verifyOperators(tokensList)
        
        // cette liste ne devrait contenir que des parenthèses et des TEnsemble
        const filteredTokensList:Array<TEnsemble | TParenthesis> = []
        for (let token of tokensList) {
            if (token instanceof TEnsemble || token instanceof TParenthesis) {
                filteredTokensList.push(token)
                continue
            }
            const chaine = token.toString().toLocaleLowerCase()
            if (chaine == "vide" || chaine == "empty" || chaine == "0") {
                filteredTokensList.push(new TEnsemble("∅"))
                continue
            }
            if (chaine == "union") {
                filteredTokensList.push(new TEnsemble("∪"))
                continue
            }
            if (chaine == "intersection" || chaine == "inter") {
                filteredTokensList.push(new TEnsemble("&"))
                continue
            }
            console.log(chaine)
            throw new Error(`<${this._saisie}> Intervalle mal construit.`)
        }
        return buildEnsemble(this._buildRpn(filteredTokensList) as Array<TEnsemble>)
    }
}

export default Parser
