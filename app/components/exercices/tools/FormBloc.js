import Bloc from "./bloc";
import { FormView } from "../run/views";
import InputBloc from "./inputbloc";



/* Il faut vérifier les answers dans entity et choisir si on affiche
   le formulaire ou pas. */

class FormBloc extends Bloc {
    static LABELS = ['form', 'formulaire'];
    _customView(entity) {
        const subViews = [];
        for (const child of this._children) {
            if (typeof child.view === "function") {
                const subView = child.view(entity);
                subViews.push(subView);
            }
        }
        const formView = new FormView({
            blocParent: this,
            model: entity,
            name: this.header,
            subViews: subViews
        });
        return formView;
    }

    /**
     * Validation des données du formulaire
     * @param {object} data 
     * @returns {object|null} un objet d'erreurs ou null si tout est ok
     */
    validation(data) {
        const errors = {};
        for (const child of this._children) {
            if (!(child instanceof InputBloc)) {
                continue;
            }
            const name = child.header;
            if (!(name in data)) {
                errors[name] = "Champ manquant";
                continue;
            }
            // Il faudrait vérifier le type ici
        }
        if (Object.keys(errors).length > 0) {
            return { validation:errors, verification:false };
        }
        const verifs = this._verification(data);
        return { validation:null, verification:verifs };
    }

    /**
     * Vérification des réponses
     * @param {object} data 
     * @returns {object} un objet de résultats
     */
    _verification(data) {
        const results = {};
        for (const child of this._children) {
            if (!(child instanceof InputBloc)) {
                continue;
            }
            const name = child.header;
            const userValue = data[name]; // existe toujours car validé avant
            const userValueTag = child.getValueTag(userValue);
            const expectedValue = child.params.expected;
            const tag = child.params.tag;
            const entete = tag?`${tag} : `:'';
            if (!expectedValue) {
                results[name] = {
                    success: false,
                    message: entete + `Aucune réponse attendue.`,
                    user:userValue,
                    score:0
                };
                continue;
            }
            // C'est là qu'il faudra prévoir les divers vérifications
            if (userValue == expectedValue) {
                const message = `${userValueTag} est une bonne réponse.`;
                results[name] = {
                    success: true,
                    message: entete + message,
                    user:userValue,
                    score:1
                };
            } else {
                const message = `${userValueTag} est une Mauvaise réponse.`;
                const complement = `La réponse attendue était : ${expectedValue}.`;
                results[name] = {
                    success: false,
                    message: entete + message + '\n' + complement,
                    user:userValue,
                    score:0
                };
            }
        }
        return results;
    }

    needSubmit(entity) {
        // Si une des questions n'a pas de réponse, il faut soumettre
        const answers = entity.get("answers") || {};
        for (const child of this._children) {
            if (!(child instanceof InputBloc)) {
                continue;
            }
            const name = child.header;
            if (!answers[name]) {
                return true;
            }
        }
        return false;
    }
}

export default FormBloc;


/*
 * Je dois mieux réfléchir au fonctionnement des formulaires
 * - L'affichage du formulaire ne pose pas de problème
 * - il faut encore que le formulaire détecte que la question a déjà reçu une réponse
 * - dans ce cas, le FormBloc doit afficher les résultats et non pas le formulaire.
 * - toujours dans ce cas, le FormBloc ne doit pas être bloquant
 * - Ainsi, il serait intéressant que le FormBloc soit remis dans la pile d'exécution
 *   de sorte que le prochain run le déclenche... ou pas, ce n'est pas indispensable
 *   puisque le FormBloc pourrait se rerender de lui même après validation
 * - ne pas oublier qu'il faut aussi porter le modèle exercice afin de permettre la sauvegarde
 *   et la restauration des réponses.
 */