import { View } from 'backbone.marionette';
import off_tpl from '@templates/home/show/home-off.jst';

const OffView = View.extend({
  className: "jumbotron",
  template: off_tpl,
  templateContext(){
    return {
      version: APP_VERSION
    }
  }
});

export { OffView };