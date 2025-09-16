import { View } from 'backbone.marionette';
import { SubmitClicked } from '@apps/common/behaviors.js';
import login_tpl from '@templates/home/login/home-login.jst';

const LoginView = View.extend({
  className:"card",
  template: login_tpl,
  behaviors: [{
    behaviorClass: SubmitClicked,
    messagesDiv: "messages"
  }],
  showForgotten: false, // défault value
  generateTitle: true,
  events: {
    "click button.js-forgotten": "forgottenClicked"
  },
  initialize() {
    this.title = this.options.title || "Connexion";
  },
  onRender() {
    if (this.getOption("generateTitle")){
      let $title = $("<div>", { text: "Connexion", class:"card-header"});
      this.$el.prepend($title);
    }
  },
  templateContext() {
    return {
      showForgotten: this.getOption("showForgotten")
    };
  },
  forgottenClicked(e) {
    e.preventDefault();
    const form = this.$el.querySelector('form');
    const fdata = new FormData(form);
    const data = Object.fromEntries(fdata.entries());
    this.trigger("login:forgotten", data.identifiant);
  }
});

export { LoginView }
