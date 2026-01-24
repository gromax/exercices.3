import _ from 'underscore'

import { Token } from './tokens/token'
import { TNumber } from './tokens/number'
import { TFunction } from './tokens/function'
import { TOperator } from './tokens/operator'
import { TParenthesis } from './tokens/parenthesis'
import { TSymbol } from './tokens/symbol'
import { build } from './rpnbuilder'
import { Scalar } from "../number/scalar"
import { Base} from "../number/base"

const TOKENS = [TNumber, TFunction, TOperator, TParenthesis, TSymbol]

class Parser {
    /** @type{string} */
    private _saisie:string

    /** @type{Array} */
    private _rpn:Array<string>

    static REGEX = new RegExp ( _.map(TOKENS, function(tok){ return `(${tok.sREGEX})`; } ).join("|"), "gi");

    /**
     * construit un objet Parser et parse la saisie
     * @param {string} expr 
     * @returns {Parser}
     */
    static build(expr:string|number): Base {
        if (typeof expr === "number") {
            return new Scalar(expr)
        }
        if (typeof expr !== "string") {
            expr = String(expr)
        }
        return build(new Parser(expr).rpn);
    }

    /**
     * constructeur
     * @param {string} saisie
     */
    private constructor(saisie:string) {
        this._saisie = saisie || ""
        this._rpn = []
        this._parse()
    }

    /**
     * @returns {Array<string>} copie de l'attribut _rpn
     */
    get rpn():Array<string> {
        return [...this._rpn];
    }

    /**
     * construit un token
     * @param {string} tokenString
     * @returns {Token}
     */
    private _createToken(tokenString:string): Token {
        for (let oToken of TOKENS) {
            let regex = oToken.REGEX;
            if (regex.test(tokenString)) {
                return new oToken(tokenString)
            }
        }
        throw new Error(`${tokenString} n'est pas valide.`)
    }

    /**
     * modifie les opérateurs + ou - qui n'ont pas une opérande sur leur gauche
     * @param {Array<Token>} tokensList
     */
    private _correctBinaireToUnaire(tokensList:Array<Token>): boolean {
        for (let i=0; i<tokensList.length; i++) {
            let oToken = tokensList[i]
            let leftIsNotOperand = ((i==0) || !tokensList[i-1].acceptOperOnRight());
            if ((oToken instanceof TOperator) && (oToken.operateOnLeft()) && leftIsNotOperand && !oToken.changeToArityOne()){
                throw new Error(`${oToken} devrait avoir potentiellement une opérande sur sa gauche`);
            }
        }
        return true
    }

    /**
     * renvoie true si les parenthèses sont équilibrées
     * @params {Array<Token>} tokens
     * @returns {boolean}
     */
    private _parenthesesAreGood(tokens:Array<Token>): boolean {
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
        return true
    }

    /**
     * transforme les frac A B en A / B
     * @params {Array} tokens Liste de tokens
     * @returns {Array|null} tokens corrigés ou null si échec
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
     * renvoie true si les opérateurs agissent comme il se doit à gauche et à droite
     * @param {Array<Token>} tokens
     * @returns {boolean}
     */
    private _verifyOperators(tokens:Array<Token>): boolean {
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
        return true
    }

    /**
     * renvoie la liste en notation polonaise inversée
     * @params {Array<Token>} tokens
     * @returns {Array<Token>} rpn
     */
    private _buildRPN(tokens:Array<Token>): Array<Token> {
        let rpn:Array<Token> = []
        let stack:Array<Token> = []
        for(let token of tokens) {
            if ((token instanceof TParenthesis) && token.ouvrant) {
                stack.push(token)
                continue
            }
            if (token instanceof TParenthesis) { // fermant
                while (stack.length>0) {
                    let depile = stack.pop()
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
                let depile = stack[stack.length - 1]
                if ((depile instanceof TParenthesis) || depile.priority < token.priority) {
                    break
                }
                rpn.push(stack.pop())
            }
            stack.push(token)
        }            
        while (stack.length > 0) {
            let depile = stack.pop()
            if (!(depile instanceof TParenthesis)) {
                rpn.push(depile)
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
     * @returns {string|null}
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
     * parse la chaîne fournie, renvoie true en cas de succès
     * @returns {boolean}
     */
    private _parse():boolean {
        let expression = this._saisie

        if (expression.includes('.') && expression.includes(',')) {
            throw new Error("Utilisez soit le point soit la virgule comme séparateur décimal, pas les deux.")
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
      
        let matchList = expression.match(Parser.REGEX)
        if (!matchList) {
            throw new Error("Aucun item valide reconnu !")
        }
        
        // Vérifier qu'il n'y a pas de caractères non reconnus
        const notTokenizedChar = this._charNotTokenized(expression, matchList)
        if (notTokenizedChar !== null) {
            if (notTokenizedChar === '.' || notTokenizedChar === ',') {
                throw new Error(`Séparateur décimal isolé : '${notTokenizedChar}'. Vérifiez.`)
            } else {
                throw new Error(`Caractère non reconnu : '${notTokenizedChar}'.`)
            }
        }

        let tokensList: Array<Token> = []
        for (let strToken of matchList) {
            let token = this._createToken(strToken);
            if (token === null) {
                return false;
            }
            tokensList.push(token);
        }

        if (!this._correctBinaireToUnaire(tokensList)) {
            return false;
        }

        if (!this._parenthesesAreGood(tokensList)) {
            return false;
        }

        tokensList = this._correctFracs(tokensList)
        if (tokensList == null) {
            return false;
        }

        tokensList = this._insertMissingMults(tokensList)

        if (!this._verifyOperators(tokensList)) {
            return false;
        }

        let rpn = this._buildRPN(tokensList)
        this._rpn = _.map(rpn, function(item){ return String(item);})
        return true
    }
}

export default Parser
