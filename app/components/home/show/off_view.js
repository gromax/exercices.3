import { View } from 'backbone.marionette';
import off_tpl from '@templates/home/show/home-off.jst';

const OffView = View.extend({
  className: "jumbotron",
  template: off_tpl,
  triggers: {
    "click a.js-login": "home:login"
  },
  templateContext(){
    return {
      version: APP_VERSION
    }
  }
});

export { OffView };