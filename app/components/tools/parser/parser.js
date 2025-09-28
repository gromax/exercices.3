import { TNumber } from './tokens/number';
import { TFunction } from './tokens/function';
import { TOperator } from './tokens/operator';
import { TParenthesis } from './tokens/parenthesis';
import { TSymbol } from './tokens/symbol';


const TOKENS = [TNumber, TFunction, TOperator, TParenthesis, TSymbol];

class Parser {
    /** @type{string} */
    #saisie;

    /** @type{Array} */
    #messages;

    /** @type{Array} */
    #rpn;

    static REGEX = new RegExp ( _.map(TOKENS, function(tok){ return `(${tok.sREGEX})`; } ).join("|"), "gi");

    /**
     * constructeur
     * @param {string} saisie 
     */
    constructor(saisie) {
        this.#saisie = saisie || "";
        this.#messages = [];
        this.#rpn = [];
        this.#parse();
    }

    /**
     * @returns {Array} copie de l'attribut #rpn
     */
    get rpn() {
        return [...this.#rpn];
    }

    /**
     * @returns {Array} copie de l'attribut #messages
     */
    get messages() {
        return [...this.#messages];
    }

    /**
     * construit un token
     * @param {string} tokenString
     * @returns {TNumber|TSymbol|TFunction|TOperator|TParenthesis|null}
     */
    #createToken(tokenString) {
        for (let oToken of TOKENS) {
            let regex = oToken.REGEX;
            if (regex.test(tokenString)) {
                return new oToken(tokenString)
            }
        }
        this.#messages.push(`${tokenString} n'est pas valide.`);
        return null;
    }

    /**
     * modifie les opérateurs + ou - qui n'ont pas une opérande sur leur gauche
     * @param {Array} tokensList
     */
    #correctBinaireToUnaire(tokensList) {
        for (let i=0; i<tokensList.length; i++) {
            /** @type{TNumber|TFunction|TOperator|TParenthesis|TSymbol} */
            let oToken = tokensList[i];
            let leftIsNotOperand = ((i==0) || !tokensList[i-1].acceptOperOnRight());
            if ((oToken instanceof TOperator) && (oToken.operateOnLeft()) && leftIsNotOperand && !oToken.changeToArityOne()){
                this.#messages.push(`${oToken} devrait avoir potentiellement une opérande sur sa gauche`);
                return false;
            }
        }
        return true;
    }

    /**
     * renvoie true si les parenthèses sont équilibrées
     * @params {Array} tokens
     * @returns {boolean}
     */
    #parenthesesAreGood(tokens){
        let ouvrants = [];
        for (let tok of tokens) {
            if (tok instanceof TParenthesis) {
                if (tok.ouvrant) {
                    ouvrants.push(tok.symbol);
                    continue;
                }
                if (ouvrants.length == 0) {
                    this.#messages.push(`${tok.symbol} n'a pas d'ouvrant.`);
                    return false;
                }
                let ouvrant = ouvrants.pop();
                if (ouvrant != tok.jumeau) {
                    this.#messages.push(`${ouvrant} fermé par ${tok.jumeau}.`);
                    return false;
                }
            }
        }
        if (ouvrants.length != 0) {
            this.#messages.push(`${ouvrants.pop()} n'a pas de fermant.`);
            return false;
        }
        return true;
    }

    /**
     * transforme les frac A B en A / B
     * @params {Array} tokens Liste de tokens
     * @returns {Array|null} tokens corrigés ou null si échec
     */
    #correctFracs(tokens) {
        let correctedTokens = [];
        let depthsFracs = [];
        let depth = 0;
        for (let token of tokens){
            if ((token instanceof TParenthesis) && token.ouvrant) {
                depth += 1;
                correctedTokens.push(token);
                continue;
            }
            if (String(token) == "frac") {
                depthsFracs.push(depth);
                continue;
            }
            if ((token instanceof TParenthesis) && token.fermant) {
                depth -= 1;
                if (depth <0) {
                    this.#messages.push('frac: parenthèses mal équilibrées.');
                    return null;
                }
            }
            correctedTokens.push(token);
            if ((depthsFracs.length>0) && (depthsFracs[depthsFracs.length-1] == depth)) {
                depthsFracs.pop();
                correctedTokens.push(new TOperator('/'));
            }
        }
        if (depth>0) {
            this.#messages.push('frac: parenthèses mal équilibrées.');
            return null;
        }
        if (depthsFracs.length>0) {
            this.#messages.push("frac: certains fracs manquent d'opérandes.");
            return null;
        }
        return correctedTokens;
    }

    /**
     * renvoie true si les opérateurs agissent comme il se doit à gauche et à droite
     * @param {Array} tokens
     * @returns {boolean}
     */
    #verifyOperators(tokens) {
        for (let i=0; i<tokens.length; i++) {
            let tok = tokens[i];
            if (tok.operateOnLeft()) {
                if (i==0) {
                    this.#messages.push(`${tok} en début d'expression.`);
                    return false;
                }
                if (!tokens[i-1].acceptOperOnRight()) {
                    this.#messages.push(`${tokens[i-1]} à gauche de ${tok}.`);
                    return false;
                }
            }
            if (tok.operateOnRight()) {
                if (i==tokens.length-1) {
                    this.#messages.push(`${tok} en fin d'expression.`);
                    return false;
                }
                if (!tokens[i+1].acceptOperOnLeft()) {
                    this.#messages.push(`${tok} à gauche de ${tokens[i+1]}.`);
                    return false;
                }
            } 
        }
        return true;
    }

    /**
     * renvoie la liste en notation polonaise inversée
     * @params {Array} tokens
     * @returns {Array} rpn
     */
    #buildRPN(tokens) {
        let rpn = [];
        let stack = [];
        for(let token of tokens) {
            if ((token instanceof TParenthesis) && token.ouvrant) {
                stack.push(token);
                continue;
            }
            if (token instanceof TParenthesis) {
                while (stack.length>0) {
                    let depile = stack.pop();
                    if (depile instanceof TParenthesis) {
                        break;
                    }
                    rpn.push(depile);
                }
                continue;
            }
            if (token.priority == 0) {
                rpn.push(token);
                continue;
            }
            while (stack.length > 0) {
                let depile = stack[stack.length - 1];
                if ((depile instanceof TParenthesis) || depile.priority < token.priority) {
                    break;
                }
                rpn.push(stack.pop());
            }
            stack.push(token);
        }            
        while (stack.length > 0) {
            let depile = stack.pop();
            if (!(depile instanceof TParenthesis)) {
                rpn.push(depile);
            }
        }
        return rpn;
    }

    /**
     * renvoie la liste de tokens avec les * manquants
     * @param {Array} tokens liste de tokens
     * @return {Array} liste corrigée
     */
    #insertMissingMults(tokens){
        let correctedTokens = [];
        let n = tokens.length;
        for (let i=0; i<n-1; i++) {
            correctedTokens.push(tokens[i]);
            if (tokens[i].acceptOperOnRight() && tokens[i+1].acceptOperOnLeft()) {
                correctedTokens.push(new TOperator('*'));
            }
        }
        if (n > 0) {
            correctedTokens.push(tokens[n-1]);
        }
        return correctedTokens;
    }

    /**
     * parse la chaîne fournie, renvoie true en cas de succès
     * @returns {boolean}
     */
    #parse() {
        /** @type{string} */
        let expression = this.#saisie;
        // correction des  \left et \right qui serait présent dans un champs de saisie latex
        expression = expression.replace(/\\\\/g, " ");
        expression = expression.replace(/left/g, " ");
        expression = expression.replace(/right/g, " ");
        // Les élèves utilisent la touche ²
        expression = expression.replace(/²/g, "^2 ");
        // Dans certains cas, le - est remplacé par un autre caractère plus long
        expression = expression.replace(/−/g, "-");
      
        let matchList = expression.match(Parser.REGEX);
        if (!matchList) {
          this.#messages.push("Aucun token valide reconnu !");
          return false;
        }
        
        let tokensList = [];
        for (let strToken of matchList) {
            let token = this.#createToken(strToken);
            if (token === null) {
                return false;
            }
            tokensList.push(token);
        }

        if (!this.#correctBinaireToUnaire(tokensList)) {
            return false;
        }

        if (!this.#parenthesesAreGood(tokensList)) {
            return false;
        }

        tokensList = this.#correctFracs(tokensList)
        if (tokensList == null) {
            return false;
        }

        tokensList = this.#insertMissingMults(tokensList);

        if (!this.#verifyOperators(tokensList)) {
            return false;
        }

        let rpn = this.#buildRPN(tokensList);
        this.#rpn = _.map(rpn, function(item){ return String(item);});
        return true;
    }
}

export { Parser }
