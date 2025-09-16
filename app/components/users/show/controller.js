import { MnObject, Region } from 'backbone.marionette'
import { ShowUserView } from './view.js'

const Controller = MnObject.extend ({
  channelName: "app",
  showUser(id, user, isMe) {
    const channel = this.getChannel();
    if (isMe) {
      channel.trigger("ariane:add", { text: "Mon compte", e: "user:show", data: id, link: `user:${id}` });
    } else {
      channel.trigger("ariane:add", { text: user ? user.get("nomComplet") : "Utilisateur inconnu", e: "user:show", data: id, link: `user:${id}` });
    }

    if (user === undefined) {
      channel.trigger("missing:item");
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
    
    new Region({ el: '#main-region' }).show(view);
  }
});

export const controller = new Controller();
