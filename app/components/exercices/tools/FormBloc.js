import Bloc from "./bloc";
import { FormView } from "../run/views";
import InputBloc from "./inputbloc";
import { error } from "jquery";

class FormBloc extends Bloc {
    static LABELS = ['form', 'formulaire'];
    _stop = true;
    _customView() {
        const subViews = [];
        for (const child of this._executionChildren) {
            if (typeof child.view === "function") {
                const subView = child.view();
                subViews.push(subView);
            }
        }
        const formView = new FormView({
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
        for (const child of this._executionChildren) {
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
        for (const child of this._executionChildren) {
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

    
}

export default FormBloc;
