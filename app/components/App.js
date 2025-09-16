import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Application} from 'backbone.marionette';
import { SessionApp } from './session/app';
import Radio from 'backbone.radio';

/* Surcharge pour rendre history sensible
   À une route introuvable
*/
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
      this.trigger("route:missing", fragment);
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

  onBeforeStart(app, options) {
    /*
    app.getRegion("dialog").onShow = function(region,view) {
      self = this;
      const closeDialog = function() {
        self.stopListening();
        self.empty();
        view.trigger("dialog:closed");
      };
      this.listenTo(view, "dialog:close", closeDialog);
      const modal = new bootstrap.Modal(this.$el, {
        backdrop: 'static',
        title: view.title,
        width: "auto",
        keyboard: false,
        close: function(e, ui) {
          closeDialog();
        }
      });
      modal.show();
    };
    */
  },
  onStart(app, options) {
    console.log("App started");
    this.version = APP_VERSION;
    this.settings = {};
    
    //require('apps/classes/classes_app.coffee');
    //require('apps/fiches/fiches_app.coffee');
    //require('apps/exercices/exercices_app.coffee');

    // import de l'appli entities, session
    const whenSessionLoaded = () => {
      require('./header/app.js').headerApp.show();
      require('./home/app.js');
      require('./ariane/app.js').arianeApp.show();
      require('@apps/common/common_app.js');
      require('@apps/common/not_found_app.js');
      require('./dataManager.js');
      require('./users/app.js');
      
      console.log("token", Radio.channel("app").request("jwt:get"));

      Backbone.history.on("route:missing", function(fragment) {
        Radio.channel("navigation").trigger("not:found");
      });
      Backbone.history.start();
    };

    new SessionApp({callBack:whenSessionLoaded});
  }
});


export const app = new Manager();
