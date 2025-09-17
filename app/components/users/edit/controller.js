import { MnObject, Region } from 'backbone.marionette'
import { EditUserView, EditPwdUserView } from './edit_views.js'
import { NewUserView } from './new_view.js';

const Controller = MnObject.extend ({
  channelName: "app",
  editMe(id, user, pwd) {
    const textLink = pwd === true ? "Modification de votre mot de passe" : "Modification de vos informations";
    const trigger = pwd === true ? "user:editPwd" : "user:edit";
    const channel = this.getChannel();
    const isAdmin = channel.request("logged:get").isAdmin();

    channel.trigger("ariane:add", [
      { text:"Mon compte", e:"user:show", data:id, link:`user:${id}` },
      { text:textLink, e:trigger, data:id, link:`user:${id}/edit` }
    ]);

    if (user === undefined) {
      channel.trigger("missing:item");
      return;
    }

    const OView = pwd === true ? EditPwdUserView : EditUserView;

    const view = new OView({
      model: user,
      generateTitle: true,
      editorIsAdmin: isAdmin,
      errorCode: "028",
      onSuccess: (model, data) => {
        channel.request("logged:get").set(data); // met à jour nom, prénom et pref
        channel.trigger("user:show", model.get("id"));
      }
    });
    new Region({ el: '#main-region' }).show(view);

  },
  
  editUser(id, user, pwd, modal) {
    const trigger = pwd === true ? "user:editPwd" : "user:edit";
    const textLink = pwd === true ? "Modification du mot de passe" : "Modification de l'utilisateur";
    const channel = this.getChannel();
    const isAdmin = channel.request("logged:get").isAdmin();

    if (!modal) {
      channel.trigger("ariane:add", [
        { text:user ? user.get("nomComplet") : "Utilisateur inconnu", e:"user:show", data:id, link:`user:${id}` },
        { text:textLink, e:trigger, data:id, link:`user:${id}/edit` }
      ]);
    }

    if (user === undefined) {
      channel.trigger("missing:item");
      return;
    }

    const OView = pwd === true ? EditPwdUserView : EditUserView;

    const view = new OView({
      title: pwd === true ? "Modification du mot de passe" : `Modification de ${user.get('prenom')} ${user.get('nom')}`,
      isModal: modal === true,
      model: user,
      editorIsAdmin: isAdmin,
      errorCode: "028",
    });
    if (modal) {
      new Region({ el: '#dialog-region' }).show(view);
    } else {
      new Region({ el: '#main-region' }).show(view);
    }
    return view;
  },

  NewUserView(model) {
    const isRoot = this.getChannel().request("logged:get").isRoot();
    const newUserView = new NewUserView({
      model: model,
      ranks: isRoot ? 2 : 1,
      errorCode: "030"
    });
    new Region({ el: "#dialog-region" }).show(newUserView);
    return newUserView;
  }
});

export const controller = new Controller();
