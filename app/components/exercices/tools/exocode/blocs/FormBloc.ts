import _ from "underscore"
import Bloc from "./bloc"
import FormView from "../views/formview.js"
import ResultsView from "../views/resultsview.js"
import { View } from "backbone.marionette"

type AnyView = View<any>|Array<View<any>>


/* Il faut vérifier les answers dans entity et choisir si on affiche
   le formulaire ou pas. */

class FormBloc extends Bloc {
    static readonly LABELS = ['form', 'formulaire']
    protected _getView(answers:Record<string, string>):AnyView {
        if (this._needSubmit(answers)) {
            // Il faut afficher le formulaire
            return this._viewFormCase(answers)
        }
        // Sinon, on affiche les résultats
        const views = this._resultsViews(answers)
        const resultView = new ResultsView()
        resultView.on('render', () => {
            const container = resultView.el.querySelector('.js-items')
            views.forEach( v => {
                (v as any).render()
                container.appendChild( (v as any).el )
            })
        })
        return resultView
    }

    private _viewFormCase(answers:Record<string, string>):AnyView {
        const subViews:Array<AnyView> = []
        for (const child of this._children) {
            if (typeof child.view === "function") {
                const subView = child.view(answers)
                subViews.push(subView)
            }
        }
        const formView = new FormView({
            blocParent: this,
            name: this.header,
            subViews: subViews
        })
        return formView
    }

    /**
     * helper pour gérer le message d'erreur de champ manquant
     * @param {Record<string, string>} userData
     * @param {Array<string>|string} name
     * @returns {Record<string, string>} un objet d'erreurs
     */
    private _champManquantError(userData:Record<string, string>, name:Array<string>|string):Record<string, string> {
        const errors = {}
        if (Array.isArray(name)) {
            for (let n of name) {
                if (!(n in userData)) {
                    errors[n] = "Champ manquant"
                }
            }
            return errors
        }
        if (!(name in userData)) {
            errors[name] = "Champ manquant"
        }
        return errors
    }

    /**
     * Validation des données du formulaire
     * @param {Record<string, string>} userData 
     * @returns {object|null} un objet d'erreurs ou null si tout est ok
     */
    validation(userData:Record<string, string>):object|null {
        let errors = {}
        for (const child of this._children) {
            if (typeof (child as any).validation !== "function") {
                continue
            }
            const name = (child as any).validation()
            if (name === '' || name === null || typeof name === 'undefined') {
                continue
            }
            const childErrors = this._champManquantError(userData, name)
            if (Object.keys(childErrors).length > 0) {
                errors = {...errors, ...childErrors}
                continue
            }
            const dataValue:string|Array<string> = Array.isArray(name)
                ? name.map(n => userData[n])
                : userData[name]
            const v = (child as any).validation(dataValue) // si tableau, les value sont dans le même ordre que les name
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
            return errors
        }
        return null
    }

    /**
     * Vérification des réponses
     * @param {Record<string, string>} userData 
     * @returns {Array<Marionette.View>} un tabeau de vues
     */
    private _resultsViews(userData:Record<string, string>):Array<AnyView> {
        const views:Array<AnyView> = []
        for (const child of this._children) {
            if (typeof (child as any).resultView !== "function") {
                continue
            }
            views.push((child as any).resultView(userData))
        }
        return _.flatten(views)
    }

    /**
     * Renvoie le score
     * @param {Record<string, string>} userData 
     * @returns {number} le score final
     */
    score(userData:Record<string, string>):number {
        const nbPoints = this._children.reduce(
            (sum, child) => (typeof (child as any).resultScore === "function")
                ? sum + ((child as any).resultScore(userData) || 0)
                : sum,
            0
        )
        return nbPoints
    }

    private _needSubmit(userData:Record<string, string>):boolean {
        // Si une des questions n'a pas de réponse, il faut soumettre
        for (const child of this._children) {
            if (typeof (child as any).validation !== "function") {
                continue
            }
            const name = (child as any).validation()
            if (name === '' || name === null || typeof name === 'undefined') {
                continue
            }
            if (Array.isArray(name)) {
                for (let n of name) {
                    if (!userData[n]) {
                        return true
                    }
                }
            } else if (!userData[name]) {
                return true
            }
        }
        return false
    }

}

export default FormBloc


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