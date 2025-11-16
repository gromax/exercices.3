import { View } from 'backbone.marionette';
import exercice_input_tpl from '@templates/exercices/run/exercice-input.jst';

const KEYS = {
  'sqrt': '$\\sqrt{x}$',
  'power': '$x^y$',
  'square': '$x^2$',
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
  },
  onKeyboardSqrt() {
    const {start, end, value} = this._getInputSelection();
    const newValue = value.slice(0, start) + 'sqrt(' + value.slice(start,end) + ')' + value.slice(end);
    const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
    input.value = newValue;
  },

  onKeyboardSquare() {
    const {start, end, value} = this._getInputSelection();
    const newValue = end-start <=1
      ? value.slice(0, end) + '^2' + value.slice(end)
      : value.slice(0, start) + '(' + value.slice(start,end) + ')^2' + value.slice(end);
    const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
    input.value = newValue;
  },

  onKeyboardPower() {
    const {start, end, value} = this._getInputSelection();
    const newValue = end-start <=1
      ? value.slice(0, end) + '^' + value.slice(end)
      : value.slice(0, start) + '(' + value.slice(start,end) + ')^' + value.slice(end);
    const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
    input.value = newValue;
  },

  _getInputSelection() {
    const input = this.el.querySelector('input[name="' + this.getOption("name") + '"]');
    return { start: input.selectionStart, end: input.selectionEnd, value: input.value };
  }
});

export default InputView;