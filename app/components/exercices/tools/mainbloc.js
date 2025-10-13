import IfBloc from "./ifbloc.js";
import Affectation from "./affectation.js";
import Bloc from "./bloc.js";
import TextNode from "./textnode.js";
import TextBloc from "./textbloc.js";
import InputBloc from "./inputbloc.js";
import FormBloc from "./FormBloc.js";
import Parameter from "./parameter.js";
import Option from "./option.js";

class MainBloc extends Bloc {
    /*
     * Propriétés
     */
    _runInitialized = false;
    _executionParams = {};
    _executionPile = [];

    /*
     * Méthodes statiques 
     */
    static parseOptions(content) {
        const mainBlock = MainBloc.parse(content, true);
        return mainBlock._parseOptions();
    }

    static parseParams(code, options, params) {
        code = code || "";
        options = options || {};
        if (typeof options === 'string') {
            options = JSON.parse(options);
        }
        params = params || {};
        if (typeof params === 'string') {
            params = JSON.parse(params);
        }
        const main = MainBloc.parse(code);
        for (let attempt = 1; attempt <= 50; attempt++) {
            const result = main._getInit(params, options);
            if (result !== null) {
                return result;
            }
        }
        throw new Error("Impossible d'initialiser les paramètres de l'exercice après 50 essais.");
    }

    /**
     * Fonction qui analyse le contenu d'un exercice et renvoie un objet représentant sa structure
     * @param {string} content le contenu à analyser
     * @returns {object} l'objet représentant la structure de l'exercice
     */
    static parse(content) {
        const lines = content.split('\n');
        const mainBlock = new MainBloc();
        const stack = [mainBlock];

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#')) {
                continue;
            }
            if (trimmed === '</main>') {
                throw new Error("Erreur de syntaxe : fin de bloc main interdite");
            }
            const condition = IfBloc.parse(trimmed);
            if (condition) {
                if (condition.tag === IfBloc.NEEDED) {
                   stack[stack.length-1].push(condition);
                   continue;
                }
                if ((condition.tag !== IfBloc.IF)&&(!(stack[stack.length-1] instanceof IfBloc))) {
                    throw new Error(`Erreur de syntaxe : ${condition.tag} sans if ou elif préalable`);
                }
                if (condition.tag === IfBloc.ELSE) {
                    stack[stack.length-1].closeIfBranch();
                    continue;
                }
                if (condition.tag === IfBloc.ELIF) {
                    stack[stack.length-1].closeIfBranch();
                }
                stack.push(condition);
                continue;
            }
            const affectation = Affectation.parse(trimmed);
            if (affectation) {
                stack[stack.length-1].push(affectation);
                continue;
            }
            if (trimmed === IfBloc.END) {
                // ferme tous les blocs elif jusqu'au if.
                do {
                    const item = stack.pop();
                    if (!(item instanceof IfBloc)) {
                        throw new Error(`Erreur de syntaxe : fin de condition referme <${item.tag}>`);
                    }
                    item.close();
                    stack[stack.length-1].push(item);
                } while (item.tag !== IfBloc.IF); // s'arrêtera forcément au pire sur le bloc MainBloc
                continue;
            }

            const parameter = Parameter.parse(trimmed);
            if (parameter) {
                stack[stack.length-1].push(parameter);
                continue;
            }

            const option = Option.parse(trimmed);
            if (option) {
                stack[stack.length-1].push(option);
                continue;
            }

            const bloc = MainBloc.parseBloc(trimmed);
            if (bloc) {
                if (!bloc.closed) {
                    stack.push(bloc);
                    continue;
                }
                stack[stack.length-1].push(bloc);
                continue;
            }
            
            const m = trimmed.match(/^<\/(\w+)>$/);
            if (m) {
                // fin de bloc
                const tag = m[1];
                const item = stack.pop();
                if (!(item instanceof Bloc)) {
                   throw new Error("Erreur de syntaxe : fin de bloc sans début");
                }
                if (item.tag !== tag) {
                    throw new Error(`Erreur de syntaxe : fin de bloc ${tag} mais on attendait </${item.tag}>`);
                }
                item.close();
                stack[stack.length-1].push(item);
                continue;
            }
            stack[stack.length-1].push(new TextNode(trimmed));
        }
        if (stack.length !== 1) {
            console.log(content);
            console.log(stack);
            throw new Error("Erreur de syntaxe : blocs non fermés");
        }
        mainBlock.close();
        return mainBlock;
    }

    static parseBloc(line) {
        const regex = /^<(\w+)\s*(:\s*[^>/]+)?>$/;
        const m = line.match(regex);
        if (m=== null) {
            return null;
        }
        const label = m[1];
        const paramsString = m[2] ? m[2].slice(1).trim() : '';
        if (TextBloc.LABELS.includes(label)) {
            return new TextBloc(label, paramsString);
        }
        if (InputBloc.LABELS.includes(label)) {
            return new InputBloc(label, paramsString);
        }
        if (FormBloc.LABELS.includes(label)) {
            return new FormBloc(label, paramsString);
        }
        return new Bloc(label, paramsString, false);
    }

    /**
     * Constructeur
     */
    constructor() {
        super('main', '', false);
        this._run = null;
    }

    /**
     * Tentative d'initialisation des paramètres tenant compte des options
     * et des paramètres déjà initialisés
     * @param {object} params 
     * @param {object} options 
     * @returns {object|null} un objet de paramètres ou null si échec
     */
    _getInit(params, options) {
        let program = [...this.children].reverse();
        while (program.length > 0) {
          let item = program.pop();
          if (item instanceof IfBloc) {
            const ifChildren = item.run({ ...params, ...options });
            if (ifChildren === null) {
                return null;
            }
            program.push(...ifChildren.reverse());
            continue;
          }
          // doit être une affectation
          if (!(item instanceof Affectation)) {
            throw new Error("L'initialisation ne doit contenir que des conditions et des affectations.");
          }
          item.doAffectation(params, options);
        }
        // Filtrage des noms en _nom
        return Object.fromEntries(
          Object.entries(params).filter(([key]) => !key.startsWith('_'))
        );
    }

    /**
     * Produit l'objet décrivant les options possibles
     */
    _parseOptions() {
        const options = {};
        const defaultsOptions = {};
        for (const child of this.children) {
            if (!(child instanceof Bloc) || child.tag !== 'option') {
                throw new Error("Le contenu des options ne peut contenir que des blocs <option>.");
            }
            const [key, defaultValue,values] = child.parseOption();
            options[key] = values;
            defaultsOptions[key] = defaultValue;
        }
        return { options, defaultsOptions };
    }

    /**
     * initialise une exécution du bloc
     * @param {*} params 
     * @param {*} options 
     */
    initRun(params, options) {
        if (!this._runInitialized) {
            throw new Error("Le bloc principal a déjà été intialisé.");
        }
        this._runInitialized = true;
        this._executionParams = { ...params, ...options };
        this._executionPile = [...this.children].reverse()
    }

    /**
     * Exécute le bloc principal et renvoie les contenus bruts
     * @param {boolean} getViews 
     * @returns {array}
     */
    run() {
        if (!this._runInitialized) {
            throw new Error("Le bloc n'a pas été initialisé pour une exécution.");
        }
        const currentRun = [];
        const params = this._executionParams;
        const pile = this._executionPile;
        while (pile.length > 0) {
            let item = pile.pop();
            const runned = item.run(params, this);
            if (runned === null) {
                continue;
            }
            if (Array.isArray(runned)) {
                pile.push(...runned.reverse());
            } else {
                currentRun.push(runned);
            }
            // s'arrête quand tombe sur un formulaire
            if (item instanceof Bloc && item.stopRun()) {
                break;
            }
        }
        return currentRun;
    }

    get finished() {
        return this._executionPile.length === 0;
    }
}

export default MainBloc;