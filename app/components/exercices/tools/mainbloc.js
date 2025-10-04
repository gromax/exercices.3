import BlocParent from "./blocparent";
import IfBloc from "./ifbloc.js";
import Affectation from "./affectation.js";
import Bloc from "./bloc.js";

class MainBloc extends BlocParent {
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
                if (condition.type === 'needed') {
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
                    if (prevItem !== null && item.type === 'else') {
                        throw new Error("Erreur de syntaxe : else doit être en dernier");
                    }
                    item.pushElse(prevItem);
                    prevItem = item;
                } while (prevItem.type === 'elif' || prevItem.type === 'else');
                stack[stack.length-1].push(prevItem);
                continue;
            }
            const bloc = Bloc.parse(trimmed);
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
                item.closed = true;
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
            stack[stack.length-1].push(trimmed);
        }
        if (stack.length !== 1) {
            throw new Error("Erreur de syntaxe : blocs non fermés");
        }
        return mainBlock;
    }

    constructor() {
        super();
    }

    evaluate(params, options) {
        let i = 0;
        let program = [...this.children];
        while (i<program.length) {
          let item = program[i];
          if (item instanceof IfBloc) {
            const result = item.evaluate(params, options);
            if (item.type === 'needed') {
              if (!result) {
                return null;
              } else {
                i++;
                continue;
              }
            }
            const ifChildren = item.evaluate(params, options) ? item.children : item.elseChildren;
            program.splice(i + 1, 0, ...ifChildren);
            i++;
            continue;
          }
          // doit être une affectation
          if (!(item instanceof Affectation)) {
            throw new Error("L'initialisation ne doit contenir que des conditions et des affectations.");
          }
          item.doAffectation(params, options);
          i++;
        }
        // Filtrage des noms en _nom
        return Object.fromEntries(
          Object.entries(params).filter(([key]) => !key.startsWith('_'))
        );
    }
}

export default MainBloc;