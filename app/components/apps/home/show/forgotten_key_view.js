import { View } from 'backbone.marionette';
import forgotten_key_tpl from '@templates/home/show/home-forgotten-key.jst';

const ForgottenKeyView = View.extend({
  className: "jumbotron",
  template: forgotten_key_tpl,
  triggers: {
    "click a.js-reinit-mdp": "forgotten:reinitMDP:click"
  }
});

export { ForgottenKeyView };