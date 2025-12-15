import { View } from 'backbone.marionette';
import exercice_input_tpl from '@templates/exercices/run/exercice-input.jst';
import result_tpl from '@templates/exercices/bloc/input-result.jst';

const KEYS = {
    'sqrt': '$\\sqrt{x}$',
    'power': '$x^y$',
    'square': '$x^2$',
    'cube': '$x^3$',
    'help': '<i class="fa-solid fa-question"></i>',
    'infini': '$\\infty$',
    'empty': 'Ø',
    'union': '$\\cup$',
}

const InputView = View.extend({
    template: exercice_input_tpl,
    templateContext() {
        return {
            name: this.getOption("name"),
            tag: this.getOption("tag"),
            answer: this.getOption("answer"),
            keyboard: Object.fromEntries(this.getOption("keyboard").map(k => [k, KEYS[k] || k]))
        };
    },
    triggers: {
        'click .js-sqrt': 'keyboard:sqrt',
        'click .js-power': 'keyboard:power',
        'click .js-square': 'keyboard:square',
        'click .js-cube': 'keyboard:cube',
        'click .js-help': 'keyboard:help',
        'click .js-infini': 'keyboard:infini',
        'click .js-empty': 'keyboard:empty',
        'click .js-union': 'keyboard:union'
    },

    regions: {
        helpRegion: '.js-help-region'
    },

    onKeyboardSqrt() {
        const {start, end, value} = this._getInputSelection();
        const newValue = value.slice(0, start) + 'sqrt(' + value.slice(start,end) + ')' + value.slice(end);
        const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
        input.value = newValue;
        input.focus();
    },

    onKeyboardSquare() {
        const {start, end, value} = this._getInputSelection();
        const newValue = end-start <=1
            ? value.slice(0, end) + '²' + value.slice(end)
            : value.slice(0, start) + '(' + value.slice(start,end) + ')²' + value.slice(end);
        const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
        input.value = newValue;
        input.focus();
    },

    onKeyboardCube() {
        const {start, end, value} = this._getInputSelection();
        const newValue = end-start <=1
            ? value.slice(0, end) + '³' + value.slice(end)
            : value.slice(0, start) + '(' + value.slice(start,end) + ')³' + value.slice(end);
        const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
        input.value = newValue;
        input.focus();
    },

    onKeyboardPower() {
        const {start, end, value} = this._getInputSelection();
        const newValue = end-start <=1
            ? value.slice(0, end) + '^' + value.slice(end)
            : value.slice(0, start) + '(' + value.slice(start,end) + ')^' + value.slice(end);
        const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
        input.value = newValue;
        input.focus();
    },

    onKeyboardHelp() {
        const helpRegionEl = this.el.querySelector('.js-help-region');
        const cards = helpRegionEl.querySelectorAll('.card');
        cards.forEach(card => card.classList.toggle('show'));
    },

    onKeyboardInfini() {
        const {start, end, value} = this._getInputSelection();
        const newValue = value.slice(0, start) + '∞' + value.slice(end);
        const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
        input.value = newValue;
        input.focus();
    },

    onKeyboardEmpty() {
        const {start, end, value} = this._getInputSelection();
        const newValue = value.slice(0, start) + '∅' + value.slice(end);
        const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
        input.value = newValue;
        input.focus();
    },

    onKeyboardUnion() {
        const {start, end, value} = this._getInputSelection();
        const newValue = value.slice(0, start) + '∪' + value.slice(end);
        const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
        input.value = newValue;
        input.focus();
    },

    _getInputSelection() {
        const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
        return { start: input.selectionStart, end: input.selectionEnd, value: input.value };
    }
});

const InputResultView = View.extend({
    template: result_tpl,
    tag: 'li',
    className() {
        return this.getOption("success")
            ? 'list-group-item list-group-item-success'
            : 'list-group-item list-group-item-danger';
    },

    templateContext() {
        return {
            message: this.getOption("message"),
        };
    }
});

export { InputView, InputResultView };