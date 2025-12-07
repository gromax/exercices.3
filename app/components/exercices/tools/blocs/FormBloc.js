import Bloc from "./bloc";
import FormView from "../blocsviews/formview.js";
import ResultsView from "../blocsviews/resultsview.js";
import InputBloc from "./inputs/inputbloc";

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
            if (typeof child.validation === 'function') {
                const v = child.validation(data[name] || '');
                if (v !== true) {
                    errors[name] = v;
                }
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
        const nbPoints = this._children.reduce(
            (sum, child) => (typeof child.resultScore === "function")
                ? sum + (child.resultScore(data) || 0)
                : sum,
            0
        );
        this._score = nbPoints;
        return _.flatten(views);
    }

    /**
     * Renvoie le score
     * @param {*} data 
     * @returns {number} le score final
     */
    get score() {
        return this._score || 0;
    }

    _needSubmit(answers) {
        // Si une des questions n'a pas de réponse, il faut soumettre
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