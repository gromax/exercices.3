import IfBloc from "./ifbloc.js";
import Affectation from "./affectation.js";
import Bloc from "./bloc.js";
import TextNode from "./textnode.js";
import TextBloc from "./textbloc.js";

class MainBloc extends Bloc {
    static parseOptions(content) {
        const mainBlock = MainBloc.parse(content, false);
        return mainBlock._parseOptions();
    }
    
    /**
     * Fonction qui analyse le contenu d'un exercice et renvoie un objet représentant sa structure
     * @param {string} content le contenu à analyser
     * @param {boolean} notext si vrai, le texte brut n'est pas autorisé
     * @returns {object} l'objet représentant la structure de l'exercice
     */
    static parse(content, notext=false) {
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
                if (condition.isNeeded()) {
                   stack[stack.length-1].push(condition);
                } else {
                    stack.push(condition);
                }
                continue;
            }
            const affectation = Affectation.parse(trimmed);
            if (affectation) {
                stack[stack.length-1].push(affectation);
                continue;
            }
            if (trimmed === IfBloc.END) {
                let prevItem = null;
                do {
                    const item = stack.pop();
                    if (!(item instanceof IfBloc) || item.closed) {
                        throw new Error("Erreur de syntaxe : fin de condition sans début");
                    }
                    if (prevItem !== null && item.isElse()) {
                        throw new Error("Erreur de syntaxe : else doit être en dernier");
                    }
                    item.pushElse(prevItem);
                    prevItem = item;
                } while (prevItem.isElif() || prevItem.isElse());
                stack[stack.length-1].push(prevItem);
                continue;
            }
            const bloc = MainBloc.parseBloc(trimmed);
            if (bloc) {
                if (notext) {
                    throw new Error(`Les blocs de texte ne sont pas autorisés ici : ${trimmed}`);
                }
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
                const label = m[1];
                const item = stack.pop();
                if (!(item instanceof Bloc)) {
                   throw new Error("Erreur de syntaxe : fin de bloc sans début");
                }
                if (item.label !== label) {
                    throw new Error(`Erreur de syntaxe : fin de bloc ${label} mais on attendait </${item.label}>`);
                }
                item.close();
                stack[stack.length-1].push(item);
                continue;
            }
            // texte simple
            if (notext) {
                if (trimmed !== '') {
                    throw new Error("Le texte brut n'est pas autorisé ici.");
                }
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
        const regex = /^<(\w+)\s*(:\s*[^>/]+)?(\/)?>$/;
        const m = line.match(regex);
        if (m=== null) {
            return null;
        }
        const label = m[1];
        const closed = (m[3] !== undefined);
        const paramsString = m[2] ? m[2].slice(1).trim() : '';
        if (TextBloc.LABELS.includes(label)) {
            return new TextBloc(label, paramsString, closed);
        }
        return new Bloc(label, paramsString, closed);
    }

    constructor() {
        super('main', '', false);
        this._run = null;
    }

    getInit(params, options) {
        let program = [...this.children].reverse();
        while (program.length > 0) {
          let item = program.pop();
          if (item instanceof IfBloc) {
            const ifChildren = item.run({...params, ...options});
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
            if (!(child instanceof Bloc) || child.label !== 'option') {
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
        params = {...params, ...options};
        this._run = {
            params,
            pile: [...this.children].reverse()
        };
    }

    run() {
        return this._execRun(false);
    }

    views() {
        return this._execRun(true);
    }

    /**
     * Exécute le bloc principal et renvoie les vues ou les contenus bruts
     * @param {boolean} getViews 
     * @returns {array}
     */
    _execRun(getViews) {
        if (!this._run) {
            throw new Error("Le bloc n'a pas été initialisé pour une exécution.");
        }
        const currentRun = []
        const params = this._run.params;
        const pile = this._run.pile;
        while (pile.length > 0) {
            let item = pile.pop();
            let runned;
            if (getViews && (typeof item.toView === "function")) {
                runned = item.toView(params);
            } else {
                runned = item.run(params);
            }
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
}

export default MainBloc;