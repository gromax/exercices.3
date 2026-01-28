import { View } from 'backbone.marionette';
import radio_tpl from '@templates/exercices/run/exercice-radio.jst';

const RadioView = View.extend({
  template: radio_tpl,
  templateContext() {
    return {
      name: this.getOption("name"),
      items: this.getOption("items"),
      answer: this.getOption("answer")
    };
  }
});

export default RadioView;