import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'use-bootstrap-tag/dist/use-bootstrap-tag.css'
import "katex/dist/katex.min.css";
import '../styles/application.css'; // ton CSS personnalisé
import { Application} from 'backbone.marionette';
import { SessionApp } from './session/app';
import Radio from 'backbone.radio';

const radioApp = Radio.channel("app");

_.extend(Backbone.History.prototype, {
  loadUrl: function(fragment) {
    fragment = this.fragment = this.getFragment(fragment);
    let matched = _.any(this.handlers, function(handler) {
      if (handler.route.test(fragment)) {
        handler.callback(fragment);
        return true;
      }
    });

    if (!matched) {
      radioApp.trigger("not:found");
    }

    return matched;
  }
});


const Manager = Application.extend({
  region: '#app-container',

  getCurrentRoute() {
    return Backbone.history && Backbone.history.fragment
  },

  navigate(route, options) {
    options = options || {};
    Backbone.history.navigate(route, options)
  },

  onStart(app, options) {
    console.log("App started");
    this.version = APP_VERSION;
    this.settings = {};
    
    //require('apps/classes/classes_app.coffee');

    // import de l'appli entities, session
    const whenSessionLoaded = () => {
      require('./header/app.js').headerApp.show();
      require('./home/app.js');
      require('./ariane/app.js').arianeApp.show();
      require('./common/app.js');
      require('./dataManager.js');
      require('./users/app.js');
      require('./exercices/app.js');
      require('./classes/app.js');
      
      console.log("token", Radio.channel("app").request("jwt:get"));
    
      Backbone.history.start();
    };
    
    new SessionApp({callBack:whenSessionLoaded});
  }
});


export const app = new Manager();
