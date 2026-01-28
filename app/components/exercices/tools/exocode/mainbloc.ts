import { IfBloc, CondBloc } from "./ifbloc"
import Affectation from "./affectation"
import Bloc from "./blocs/bloc"
import TextNode from "./textnode"
import TextBloc from "./blocs/textbloc"
import InputTextBloc from "./blocs/input/inputtextbloc"
import InputEnsemble from "./blocs/input/inputensemble"
import RadioBloc from "./blocs/input/radiobloc"
import FormBloc from "./FormBloc"
import Parameter from "./parameter"
import Option from "./option"
import Halt from "./halt"
import GraphBloc from "./blocs/graphbloc"
import TkzTabBloc from "./blocs/tkztabbloc"
import { ChoiceBloc } from "./blocs/choice"
import InputChoice from "./blocs/input/inputchoice"
import Colors from "../colors"

const TRYNUMBER = 100;

class MainBloc {
    private _children:Array<Bloc>;

    /*
     * Méthodes statiques 
     */
    static parseOptions(content:string) {
        const mainBlock = MainBloc._parse(content);
        return mainBlock._parseOptions();
    }

    static parseParams(code, options) {
        code = code || "";
        options = options || {};
        if (typeof options === 'string') {
            options = JSON.parse(options);
        }
        const main = MainBloc._parse(code);
        for (let attempt = 1; attempt <= TRYNUMBER; attempt++) {
            const result = main._getInit(options);
            if (result !== null) {
                return result;
            }
        }
        throw new Error(`Impossible d'initialiser les paramètres de l'exercice après ${TRYNUMBER} essais.`);
    }

    static runCode(code, params, options) {
        const main = MainBloc._parse(code);
        return main.run(params, options);
    }
        
    /**
     * Fonction qui analyse le contenu d'un exercice et renvoie un objet représentant sa structure
     * @param {string} content le contenu à analyser
     * @returns {object} l'objet représentant la structure de l'exercice
     */
    private static _parse(content:string):MainBloc {
        const colors = new Colors(); // instancie une palette pour les blocs qui en auraient besoin
        const lines = content.split('\n');
        const mainBlock = new MainBloc();
        const stack = [mainBlock];

        for (const line of lines) {
            if (line.startsWith('#')) {
                continue;
            }
            const beforeHash = line.split('#')[0];
            const trimmed = beforeHash.trim();
            if (trimmed === '</main>') {
                throw new Error("Erreur de syntaxe : fin de bloc main interdite");
            }

            if (CondBloc.isElse(trimmed)) {
                stack[stack.length-1].closeIfBranch();
                continue;
            }
            const condition = CondBloc.tryParse(trimmed);
            if (CondBloc.isNeeded(condition)) {
                stack[stack.length-1].push(condition);
                continue;
            } else if (CondBloc.isUntil(condition)) {
                stack.push(condition);
                continue;
            } else if (condition !== null) {
                if ((condition.tag !== IfBloc.IF)&&(!(stack[stack.length-1] instanceof IfBloc))) {
                    throw new Error(`Erreur de syntaxe : ${condition.tag} sans if ou elif préalable`);
                }
                if (condition.tag === IfBloc.ELIF) {
                    stack[stack.length-1].closeIfBranch();
                }
                stack.push(condition);
                continue;
            }

            // je dois test options avant affectation
            // car en cas de @x => ... cela pourrait être pris
            // pour une affectation
            const option = Option.parse(trimmed);
            if (option) {
                stack[stack.length-1].push(option);
                continue;
            }

            const affectation = Affectation.parse(trimmed);
            if (affectation) {
                stack[stack.length-1].push(affectation);
                continue;
            }
            if (trimmed === IfBloc.END) {
                // ferme tous les blocs elif jusqu'au if.
                let item;
                do {
                    item = stack.pop();
                    if (!(item instanceof IfBloc)) {
                        throw new Error(`Erreur de syntaxe : fin de condition referme <${item.tag}>`);
                    }
                    item.close();
                    stack[stack.length-1].push(item);
                } while (item.tag !== IfBloc.IF); // s'arrêtera forcément au pire sur le bloc MainBloc
                continue;
            }

            const halt = Halt.parse(trimmed);
            if (halt) {
                stack[stack.length-1].push(halt);
                continue;
            }

            const parameter = Parameter.parse(trimmed);
            if (parameter) {
                stack[stack.length-1].push(parameter);
                continue;
            }

            const bloc = MainBloc._parseBloc(trimmed);
            if (bloc) {
                if (typeof bloc.setColors === 'function') {
                    // si le bloc nécessite une palette de couleurs
                    // on la lui fournit
                    bloc.setColors(colors);
                }
                if (bloc.closed) {
                    stack[stack.length-1].push(bloc);
                } else {
                    stack.push(bloc);
                }
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
            if (/^<.*:.*\/?>$/.test(trimmed)) {
                throw new Error(`Erreur de syntaxe : bloc non reconnu ${trimmed}`);
            }
            stack[stack.length-1].push(new TextNode(trimmed));
        }
        if (stack.length !== 1) {
            throw new Error("Erreur de syntaxe : blocs non fermés");
        }
        mainBlock.close();
        return mainBlock;
    }

    private static _parseBloc(line:string):Bloc|null {
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
        if (InputTextBloc.LABEL == label) {
            return new InputTextBloc(label, paramsString);
        }
        if (RadioBloc.LABEL == label) {
            return new RadioBloc(label, paramsString);
        }
        if (InputEnsemble.LABEL == label) {
            return new InputEnsemble(label, paramsString);
        }
        if (FormBloc.LABELS.includes(label)) {
            return new FormBloc(label, paramsString);
        }
        if (GraphBloc.LABELS.includes(label)) {
            return new GraphBloc(label, paramsString);
        }
        if (ChoiceBloc.LABELS.includes(label)) {
            return new ChoiceBloc(label, paramsString);
        }
        if (InputChoice.LABELS.includes(label)) {
            return new InputChoice(label, paramsString);
        }
        if (TkzTabBloc.LABELS.includes(label)) {
            return new TkzTabBloc(label, paramsString);
        }
        return new Bloc(label, paramsString, false);
    }

    /**
     * Constructeur
     */
    private constructor() {
        this._children = [];
    }

    push(child:Bloc):void {
        this._children.push(child);
    }

    /**
     * Tentative d'initialisation des paramètres
     * @param {object} options 
     * @returns {object|null} un objet de paramètres ou null si échec
     */
    private _getInit(options) {
        const params = {};
        let program = [...this.children].reverse();
        while (program.length > 0) {
            let item = program.pop();
            if (item instanceof Halt) {
                // arrêt de l'initialisation
                return params;
            }
            if (item instanceof TextNode) {
                continue;
            }
            if (CondBloc.isNeeded(item)) {
                if (item.run({ ...params, ...options }) === null) {
                    return null;
                }
                continue;
            }
            if ((item instanceof IfBloc) || CondBloc.isUntil(item)) {
                const children = item.run({ ...params, ...options });
                program.push(...children.reverse());
                continue;
            }
            // doit être une affectation
            if (!(item instanceof Affectation)) {
                throw new Error("L'initialisation ne doit contenir que des conditions et des affectations.");
            }
            item.doAffectation(params, options);
        }
        // Filtrage des noms en _nom
        const filtered = Object.fromEntries(
            Object.entries(params).filter(([key]) => !key.startsWith('_'))
        );
        // on veut stringifier les valeurs
        Object.keys(filtered).forEach(key => {
            filtered[key] = this.#stringifyValue(filtered[key]);
        })
        return filtered;
    }

    #stringifyValue(value) {
        if (Array.isArray(value)) {
            return value.map(v => this.#stringifyValue(v))
        }
        if (typeof value === 'undefined' || value === null) {
            return ''
        }
        if (typeof value.toStringSimplified === 'function') {
            return value.toStringSimplified();
        }
        return String(value)
    }

    /**
     * Produit l'objet décrivant les options possibles
     */
    _parseOptions() {
        const options = {};
        const defaultsOptions = {};
        for (const child of this.children) {
            if (child instanceof TextNode){
                continue;
            }
            if (!(child instanceof Bloc) || child.tag !== 'option') {
                throw new Error("Le contenu des options ne peut contenir que des blocs <option>.");
            }
            const [key, defaultValue,values] = child.parseOption();
            if (key.startsWith('_')) {
                throw new Error(`Le nom d'option ${key} est invalide (ne doit pas commencer par _).`);
            }
            options[key] = values;
            defaultsOptions[key] = defaultValue;
        }
        return { options, defaultsOptions };
    }

    /**
     * Exécute le bloc principal et renvoie les contenus bruts
     * @param {boolean} getViews 
     * @returns {array}
     */
    run(params, options) {
        if (this._runned) {
            // déjà exécuté
            throw new Error("Le bloc principal ne peut être exécuté qu'une seule fois.");
        }
        this._runned = true;
        const parameters = { ...params, ...options };
        const pile = [...this.children].reverse();
        this._children = [];
        while (pile.length > 0) {
            let item = pile.pop();
            if (item instanceof Halt) {
                // arrêt de l'exécution
                break;
            }
            const runned = item.run(parameters, this);
            if (runned === null) {
                continue;
            }
            if (Array.isArray(runned)) {
                pile.push(...runned.reverse());
            } else {
                this._children.push(runned);
            }
        }
        return this._children.reverse();
    }
}

export default MainBloc;