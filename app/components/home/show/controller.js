import { MnObject, Region } from 'backbone.marionette';
import { EleveListeDevoirs, EleveLayout } from './home_eleve_views';
import { NotFoundView } from './not_found_view';
import { OffView } from './off_view';
import { ForgottenKeyView } from './forgotten_key_view';
import { AdminProfPanel } from './admin_prof_panel';

const Controller = MnObject.extend({
  channelName: "app",
  notFound() {
    const view = new NotFoundView();
    new Region({ el: '#main-region'}).show(view);
  },
  showAdminHome() {
    let unread = this.getChannel().request("logged:get").get("unread");
    const view = new AdminProfPanel({adminMode:true, unread:unread});
    view.on("show:list", (cible)=> this.getChannel().trigger(`${cible}:list`));
    new Region({ el: '#main-region'}).show(view);
  },

  showProfHome() {
    let unread = this.getChannel().request("logged:get").get("unread");
    const view = new AdminProfPanel({adminMode:false, unread:unread});
    new Region({ el: '#main-region'}).show(view);
  },

  showOffHome() {
    const view = new OffView();
    new Region({ el: '#main-region'}).show(view);
  },

  showEleveHome() {
    const channel = this.getChannel();
    channel.trigger("loading:up");
    let layout = new EleveLayout();
    //require('entities/dataManager.coffee');
    let fetchingData = channel.request("custom:entities", ["userfiches", "exofiches", "faits"]);
    $.when(fetchingData).done( (userfiches, exofiches, faits) => {
      const listEleveView = new EleveListeDevoirs({
        collection: userfiches,
        exofiches: exofiches,
        faits: faits
      });
      listEleveView.on("item:devoir:show", (childView) => {
        model = childView.model;
        channel.trigger("devoir:show", model.get("id"));
      });
    }).fail( (response) => {
      channel.trigger("data:fetch:fail", response);
    }).always( function(){
      channel.trigger("loading:down");
    });
  },

  showLogOnForgottenKey(success) {
    if (success) {
      let view = new ForgottenKeyView();
      view.on("forgotten:reinitMDP:click", () => {
        this.getChannel().trigger("user:editPwd", null);
      });
      new Region({ el: '#main-region'}).show(view);
    } else {
      this.getChannel().trigger("show:message:error", {
        title:"Clé introuvable !",
        message:"L'adresse que vous avez saisie n'est pas valable."
      });
    }
  }
});

const controller = new Controller();

export { controller }

