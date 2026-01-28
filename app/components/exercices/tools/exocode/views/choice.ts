import { View, CollectionView } from 'backbone.marionette'
import choice_tpl from '@templates/exercices/bloc/choice-item.jst'
import form_choice_layout_tpl from '@templates/exercices/bloc/form-choice-layout.jst'
import renderTexInDomElement from '../../../../common/rendertex'

const ChoiceView = View.extend({
    template: choice_tpl,
    triggers: {
        'click button.js-choice-button': 'click',
    },
    templateContext() {
        return {
            button: this.getOption("button") || false
        }
    },

    /**
     * Répond à un clic sur un item de la liste de choix
     * @param {number} vmax valeur max pour le choix
     * @param {Color} colorSet jeu de couleurs
     * @param {boolean} squareOnly indique si on utilise des pictogrammes ou non
     * @param {HTMLElement} inputNode nœud input associé
     * @param {Collection} notshuffledCollection 
     */
    itemClick(vmax, colorSet, squareOnly, inputNode, notshuffledCollection) {
        const model = this.model
        let idx = model.get('index')
        idx += 1
        if (idx > vmax) {
            idx = 1
        }
        model.set({
            index: idx,
            color: colorSet.getColor(idx),
        });
        if (!squareOnly) {
            model.set({
                picto: colorSet.getPicto(idx),
            })
        }
        inputNode.val(
            notshuffledCollection.map(m => m.get('index')).join('')
        );
        this.render();
        renderTexInDomElement(this.el)
    }
})

const ChoicesView = CollectionView.extend({
    childView: ChoiceView,
    childViewEventPrefix: 'item',
    childViewOptions(model) {
        return {
            button: this.getOption("button") || false
        };
    },
    className: 'list-group mb-3',
    tagName() {
        return this.getOption("button") ? 'div' : 'ul'
    }
    
});

const ChoiceFormLayout = View.extend({
    template: form_choice_layout_tpl,
    regions: {
        content: '.js-items',
        errors: '.js-validation-error'
    },

    templateContext() {
        return {
            name: this.getOption('name') || 'choice_answer',
            value: this.getOption('value') || '',
        }
    }
})

export { ChoicesView, ChoiceView, ChoiceFormLayout }