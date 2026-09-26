import { View, CollectionView } from 'backbone.marionette'
import { Model } from 'backbone'
import type ChoiceManager from '../blocs/choicemanager'
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
     * @param {ChoiceManager} manager instance du gestionnaire de choix
     * @param {HTMLElement} inputNode nœud input associé
     */
    itemClick(
        manager:ChoiceManager,
        inputNode:JQuery<HTMLElement>
    ):void {
        const model = this.model
        let idx = model.get('index')
        // On parcourt dans l'ordre défini par le manager
        const order = manager.order_index
        if (idx == 0) {
            idx = order[0]
        } else {
            const currentPos = order.indexOf(idx)
            idx = order[(currentPos + 1)%order.length] || order[0]
        }
        model.set({
            index: idx,
            color: manager.colors.getColor(idx),
        });
        if (!manager.squaresOnly) {
            model.set({
                picto: manager.colors.getPicto(idx),
            })
        }
        model.set({
            tag: manager.tags[idx] || ''
        })
        inputNode.val(
            manager.notShuffledCollection.map(m => m.get('index')).join('')
        );
        this.render();
        renderTexInDomElement(this.el)
    }
})

const ChoicesView = CollectionView.extend({
    childView: ChoiceView,
    childViewEventPrefix: 'item',
    childViewOptions(model:Model) {
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