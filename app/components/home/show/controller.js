import { MnObject } from 'backbone.marionette';
import { NotFoundView } from './not_found_view';
import { OffView } from './off_view';
import { ForgottenKeyView } from './forgotten_key_view';
import { AdminProfPanel } from './admin_prof_panel';

const Controller = MnObject.extend({
  channelName: "app",
  notFound() {
    const channel = this.getChannel();
    const view = new NotFoundView();
    channel.request("region:main").show(view);
  },
  showAdminHome() {
    const channel = this.getChannel();
    channel.trigger("ariane:reset", []);
    let unread = this.getChannel().request("logged:get").get("unread");
    const view = new AdminProfPanel({adminMode:true, unread:unread});
    view.on("show:list", (cible)=> this.getChannel().trigger(`${cible}:list`));
    channel.request("region:main").show(view);
  },

  showProfHome() {
    const channel = this.getChannel();
    channel.trigger("ariane:reset", []);
    let unread = this.getChannel().request("logged:get").get("unread");
    const view = new AdminProfPanel({adminMode:false, unread:unread});
    channel.request("region:main").show(view);
  },

  showOffHome() {
    const channel = this.getChannel();
    channel.trigger("ariane:reset", []);
    const view = new OffView();
    channel.request("region:main").show(view);
  },

  showLogOnForgottenKey(success) {
    const channel = this.getChannel();
    if (success) {
      let view = new ForgottenKeyView();
      view.on("forgotten:reinitMDP:click", () => {
        channel.trigger("user:editPwd", null);
      });
      channel.request("region:main").show(view);
    } else {
      channel.trigger("show:message:error", {
        title:"Clé introuvable !",
        message:"L'adresse que vous avez saisie n'est pas valable."
      });
    }
  }
});

const controller = new Controller();

export { controller }

