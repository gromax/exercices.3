import { View } from 'backbone.marionette';
import Form from '../../behaviors/form.js';
import login_tpl from '@templates/home/login/home-login.jst';

const LoginView = View.extend({
  className:"card",
  template: login_tpl,
  behaviors: [Form],
  showForgotten: false, // default value
  templateContext() {
    return {
      showForgotten: this.getOption("showForgotten")
    };
  },
});

export { LoginView }
