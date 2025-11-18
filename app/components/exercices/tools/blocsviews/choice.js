import { View, CollectionView } from 'backbone.marionette';
import choice_tpl from '@templates/exercices/bloc/choice-item.jst'
import form_choice_layout_tpl from '@templates/exercices/bloc/form-choice-layout.jst'

const ChoiceView = View.extend({
    template: choice_tpl,
    triggers: {
        'click button.js-choice-button': 'click',
    },
    templateContext() {
        return {
            button: this.getOption("button") || false
        };
    }
});

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
        return this.getOption("button") ? 'div' : 'ul';
    }
});

const ChoiceFormLayout = View.extend({
    template: form_choice_layout_tpl,
    regions: {
        content: '.js-content',
        errors: '.js-validation-error'
    },
    triggers: {
        'submit form': 'submit'
    },

    templateContext() {
        return {
            name: this.getOption('name') || 'choice_answer',
            value: this.getOption('value') || '',
        };
    },

    onSubmit() {
        const form = this.el.querySelector('form');
        const fdata = new FormData(form);
        const data = Object.fromEntries(fdata.entries());
        this.dataSubmit(data);
    },

    dataSubmit(data) {
        const blocParent = this.getOption("blocParent");
        if (!blocParent || typeof blocParent.validation !== 'function') {
            console.warn("Pas de validation possible, bloc parent manquant ou invalide");
            this.trigger("validation:success", data);
        return;
        }
        const error = blocParent.validation();
        if (error !== null) {
            this.showError(error);
            return;
        }
        this.trigger("validation:success", data);
    },

    showError(error) {
        const $container = this.$el.find(".js-validation-error");
        $container.html(`<div class='invalid-feedback d-block'>${error}</div>`);
    },

});

export { ChoicesView, ChoiceFormLayout };