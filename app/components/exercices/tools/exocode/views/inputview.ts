import { View } from 'backbone.marionette';
import exercice_input_tpl from '@templates/exercices/run/exercice-input.jst';
import result_tpl from '@templates/exercices/bloc/input-result.jst';

const KEYS = {
    'sqrt': { tag: '$\\sqrt{x}$', pre:'sqrt(' , post: ')' },
    'power': { tag: '$x^y$', pre:'(' , post: ')^', rep:'^' },
    'square': { tag: '$x^2$', pre:'(', post: ')²', rep:'²' },
    'sqr': { tag: '$x^2$', pre:'(', post: ')²', rep:'²' },
    'cube': { tag: '$x^3$', pre:'(', post: ')³', rep:'³' },
    'help': { tag: '<i class="fa-solid fa-question"></i>' },
    'infini': { tag: '$\\infty$', rep:'∞' },
    'pinfini': { tag: '$+\\infty$', rep:'+∞' },
    'minfini': { tag: '$-\\infty$', rep:'-∞' },
    'empty': { tag: '$\\emptyset$', rep:'∅' },
    'union': { tag: '$\\cup$', rep:'∪' },
}

const InputView = View.extend({
    template: exercice_input_tpl,
    _getKeyboard() {
        if (typeof this._keyboardKeys !== 'undefined') {
            return this._keyboardKeys
        }
        const keyboardOption = this.getOption("keyboard") || []
        this._keyboardKeys = {}
        for (let item of keyboardOption) {
            if (typeof KEYS[item] !== 'undefined') {
                this._keyboardKeys[item] = KEYS[item]
                continue
            }
            const fragments = item.split(':')
            const name = fragments[0]
            const tag = fragments.length > 1 ? fragments[1] : name
            const replacement = fragments.length > 2 ? fragments[2] : name
            const keyObj = { tag: tag, rep: replacement }
            this._keyboardKeys[name] = keyObj
        }
        return this._keyboardKeys
    },
    
    templateContext() {
        return {
            name: this.getOption("name"),
            tag: this.getOption("tag"),
            answer: this.getOption("answer"),
            keyboard: this._getKeyboard()
        };
    },
    events: {
        'click button.js-keyboard': 'onKeyboardPress',
        'click .js-sqrt': 'onKeyboardSqrt',
        'click .js-power': 'onKeyboardPower',
        'click .js-square': 'onKeyboardSquare',
        'click .js-cube': 'onKeyboardCube',
        'click .js-help': 'onKeyboardHelp',
        'click .js-infini': 'onKeyboardInfini',
        'click .js-empty': 'onKeyboardEmpty',
        'click .js-union': 'onKeyboardUnion'
    },

    regions: {
        helpRegion: '.js-help-region'
    },

    onKeyboardPress(e) {
        e.preventDefault()
        const keyName = $(e.currentTarget).data('name')
        if (keyName === 'help') {
            this._keyboardHelp()
            return
        }
        const keyboard = this._getKeyboard()
        const params = keyboard[keyName]
        if (!params) {
            console.warn("Touche de clavier non définie:", keyName)
            return
        }
        const {start, end, value} = this._getInputSelection()
        let newValue = ''
        if (end - start == 0) {
            const replacement = params.rep || ((params.pre || '') + (params.post || '')) || ''
            newValue = value.slice(0, start) + replacement + value.slice(end);
        } else if (params.pre) {
            const post = params.post || ''
            newValue = value.slice(0, start) + params.pre + value.slice(start, end) + post + value.slice(end);
        } else {
            const replacement = params.rep || ((params.pre || '') + (params.post || '')) || ''
            newValue = value.slice(0, start) + replacement + value.slice(end);
        }
        const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
        input.value = newValue;
        input.focus();
    },

    _keyboardHelp() {
        const helpRegionEl = this.el.querySelector('.js-help-region');
        const cards = helpRegionEl.querySelectorAll('.card');
        cards.forEach(card => card.classList.toggle('show'));
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