import Bloc from "./bloc";
import FormView from "../views/formview.js";
import ResultsView from "../views/resultsview.js";

/* Il faut vérifier les answers dans entity et choisir si on affiche
   le formulaire ou pas. */

class FormBloc extends Bloc {
    static LABELS = ['form', 'formulaire'];
    _customView(answers) {
        if (this._needSubmit(answers)) {
            // Il faut afficher le formulaire
            return this._viewFormCase(answers);
        }
        // Sinon, on affiche les résultats
        const views = this.resultsViews(answers);
        const resultView = new ResultsView()
        resultView.on('render', () => {
            const container = resultView.el.querySelector('.js-items');
            views.forEach( v => {
                v.render()
                container.appendChild( v.el )
            });
        });
        return resultView;
    }

    _viewFormCase(answers) {
        const subViews = [];
        for (const child of this._children) {
            if (typeof child.view === "function") {
                const subView = child.view(answers);
                subViews.push(subView);
            }
        }
        const formView = new FormView({
            blocParent: this,
            name: this.header,
            subViews: subViews
        });
        return formView;
    }

    /**
     * helper pour gérer le message d'erreur de champ manquant
     * @param {Array<string>|string} name
     * @param {object} errors
     */
    _champManquantError(data, name, errors) {
        if (Array.isArray(name)) {
            name.forEach(n => this._champManquantError(data, n, errors));
            return errors
        }
        if (!(name in data)) {
            errors[name] = "Champ manquant"
        }
        return errors
    }

    /**
     * Validation des données du formulaire
     * @param {object} data 
     * @returns {object|null} un objet d'erreurs ou null si tout est ok
     */
    validation(data) {
        let errors = {}
        for (const child of this._children) {
            if (typeof child.validation !== "function") {
                continue
            }
            const name = child.validation()
            if (name === '' || name === null || typeof name === 'undefined') {
                continue
            }
            const childErrors = this._champManquantError(data, name, {})
            if (Object.keys(childErrors).length > 0) {
                errors = {...errors, ...childErrors}
                continue
            }
            const dataValue = Array.isArray(name)
                ? name.map(n => data[n])
                : data[name]
            const v = child.validation(dataValue) // si tableau, les value sont dans le même ordre que les name
            if (v === true) {
                continue
            }
            if (Array.isArray(name)) {
                if (typeof v !== "object") {
                    throw new Error(`La validation pour un champ multiple doit renvoyer un objet d'erreurs.`)
                }
                errors = {...errors, ...v}
            } else {
                errors[name] = v
            }
        }
        if (Object.keys(errors).length > 0) {
            return errors;
        }
        return null;
    }

    /**
     * Vérification des réponses
     * @param {object} data 
     * @returns {Array<Marionette.View>} un tabeau de vues
     */
    resultsViews(data) {
        const views = [];
        for (const child of this._children) {
            if (typeof child.resultView !== "function") {
                continue;
            }
            views.push(child.resultView(data));
        }
        return _.flatten(views);
    }

    /**
     * Renvoie le score
     * @param {*} data 
     * @returns {number} le score final
     */
    score(data) {
        const nbPoints = this._children.reduce(
            (sum, child) => (typeof child.resultScore === "function")
                ? sum + (child.resultScore(data) || 0)
                : sum,
            0
        )
        return nbPoints
    }

    _needSubmit(answers) {
        // Si une des questions n'a pas de réponse, il faut soumettre
        for (const child of this._children) {
            if (typeof child.validation !== "function") {
                continue
            }
            const name = child.validation()
            if (name === '' || name === null || typeof name === 'undefined') {
                continue
            }
            if (Array.isArray(name)) {
                for (let n of name) {
                    if (!answers[n]) {
                        return true;
                    }
                }
            } else if (!answers[name]) {
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