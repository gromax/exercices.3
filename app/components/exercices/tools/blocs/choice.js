import { Model, Collection } from 'backbone'
import Bloc from "./bloc";
import Colors from "../colors.js";
import { ChoicesView, ChoiceFormLayout } from "../blocsviews/choice.js";
import renderMathInElement from "katex/contrib/auto-render";

class Choice extends Bloc {
    constructor(label, paramsString) {
        super(label, paramsString, false);
        this._options = [];
        this._valuemax = 0;
    }

    /**
     * Définir les couleurs à utiliser
     * @param {Colors} colors 
     */
    setColors(colors) {
        this._colors = colors;
    }

    setOption(key, value) {
        let index = /[0-9]+/.test(key) ? parseInt(key) : 0;
        if (index > 7) {
            index = 0;
        }
        this._options.push({index, value});
    }

    _makeCollection() {
        this._collection = new Collection();
        const showIndex = this instanceof ChoiceForm ? 0 : index;
        const squareOnly = (typeof this._params.onlysquares === 'undefined') || Boolean(this._params.onlysquares);
        for (const {index, value} of this._options) {
            this._valuemax = Math.max(this._valuemax, index);
            const m = new Model({
                caption: value,
                index: showIndex,
                goodIndex:index,
                color: this._colors.getColor(showIndex),
                picto: squareOnly ? 'square' : this._colors.getPicto(showIndex),
                goodcolor: this._colors.getColor(index),
                goodpicto: squareOnly ? 'square' : this._colors.getPicto(index),
            });
            this._collection.add(m);
            this._notshuffledCollection = this._collection;
        }
    }

    _shuffle() {
        this._collection = new Collection(this._collection.shuffle());
    }
}

class ChoiceList extends Choice {
    static LABELS = ['choices', 'choix'];
    _customView(answers) {
        this._makeCollection();
        if ((typeof this._params.shuffle === 'undefined') || Boolean(this._params.shuffle)) {
            this._shuffle();
        }
        return new ChoicesView({
            collection: this._collection,
            button: false
        });
    }
}

class ChoiceForm extends Choice {
    static LABELS = ['choiceform', 'formulairechoix', 'formchoice', 'formchoix'];
    _customView(answers) {
        if (typeof this._collection === 'undefined') {
            this._makeCollection();
            if ((typeof this._params.shuffle === 'undefined') || Boolean(this._params.shuffle)) {
                this._shuffle();
            }
        }
        if (this._needSubmit(answers)) {
            // Il faut afficher le formulaire
            return this._viewFormCase(answers);
        }
        // Sinon, on affiche les résultats
        this.verification(answers);
        return new ChoicesView({
            collection: this._collection,
            button: false
        });
    }

    _viewFormCase(answers) {
        const subViews = [];
        for (const child of this._children) {
            if (typeof child.view === "function") {
                const subView = child.view(answers);
                subViews.push(subView);
            }
        }
        const layout = new ChoiceFormLayout({
            name: this.header,
            blocParent: this,
            value: '0'.repeat(this._options.length),
        });
        const squareOnly = (typeof this._params.onlysquares !== 'undefined') && Boolean(this._params.onlysquares);
        const lView = new ChoicesView({
            collection: this._collection,
            button: true
        });
        lView.on('item:click', (childView) => {
            const model = childView.model;
            let idx = model.get('index');
            idx += 1;
            if (idx > this._valuemax) {
                idx = 1;
            }
            model.set({
                index: idx,
                color: this._colors.getColor(idx),
            });
            if (!squareOnly) {
                model.set({
                    picto: this._colors.getPicto(idx),
                });
            }
            layout.$el.find(`input[name="${this.header}"]`).val(
                this._notshuffledCollection.map(m => m.get('index')).join('')
            );
            childView.render();
            renderMathInElement(childView.el, {
                delimiters: [
                {left: "$", right: "$", display: false},
                {left: "$$", right: "$$", display: true}
                ],
                throwOnError: false
            });


        });
        layout.on('render', function() {
            const container = this.el.querySelector('.js-content');
            for (const subView of subViews) {
                container.appendChild(subView.el);
                subView.render();
            }
            container.appendChild(lView.el);
            lView.render();
        });
        return layout;
    }

    _needSubmit(answers) {
        const name = this.header;
        return (!(name in answers));
    }

    /**
     * Validation des données du formulaire
     * @returns {string|null} un texte d'erreur ou null si tout est ok
     */
    validation() {
        const unselected = this._collection.reduce(
            (acc, model) => acc || (model.get('index') === 0),
            false
        );
        if (unselected) {
            return "Vous devez faire un choix pour tous les items.";
        }
        return null;
    }

    /**
     * Vérification des réponses
     * @param {object} answers 
     * @returns {object} un objet de résultats
     */
    verification(answers) {
        const answer = answers[this.header] || '';
        let count = 0;
        for (let i = 0; i < this._notshuffledCollection.length; i++) {
            const model = this._notshuffledCollection.at(i);
            const userValue = parseInt(answer.charAt(i)) || 0;
            model.set('index', userValue);
            if (userValue === model.get('goodIndex')) {
                model.set('good', true);
                count += 1;
            } else {
                model.set('good', false);
            }

        }
        this._score = count;
    }

    get score() {
        return this._score || 0;
    }

    nombrePts() {
        return this._options.length;
    }
}

export { ChoiceList, ChoiceForm };
