import { MnObject, Region } from 'backbone.marionette'
import { ShowUserView } from './view.js'

const Controller = MnObject.extend ({
  channelName: "app",
  showUser(user) {
    const channel = this.getChannel();
    if (!user) {
      channel.trigger("popup:error", "Utilisateur introuvable");
      return;
    }
    const view = new ShowUserView({
      model: user
    });

    view.on("click:edit", () => {
      channel.trigger("user:edit", user.get("id"));
    });

    view.on("click:edit:pwd", () => {
      channel.trigger("user:editPwd", user.get("id"));
    });

    channel.request("region:main").show(view);
  }
});

export const controller = new Controller();
