import { MnObject, Region } from 'backbone.marionette'
import { EditUserView, EditPwdUserView } from './edit_views.js'
import { NewUserView, ClasseSignin, ClasseChange } from './new_view.js';

const Controller = MnObject.extend ({
  channelName: "app",
  editMe(id, user, pwd) {
    const textLink = pwd === true ? "Modification de votre mot de passe" : "Modification de vos informations";
    const trigger = pwd === true ? "user:editPwd" : "user:edit";
    const channel = this.getChannel();
    const isAdmin = channel.request("logged:get").isAdmin();

    channel.trigger("ariane:add", [
      { text:"Mon compte", link:`user:${id}` },
      { text:textLink, link:`user:${id}/edit` }
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
  
  editUser(id, user, pwd) {
    const trigger = pwd === true ? "user:editPwd" : "user:edit";
    const textLink = pwd === true ? "Modification du mot de passe" : "Modification de l'utilisateur";
    const channel = this.getChannel();
    const isAdmin = channel.request("logged:get").isAdmin();

    channel.trigger("ariane:add", [
      { text:user ? user.get("nomComplet") : "Utilisateur inconnu", link:`user:${id}` },
      { text:textLink, link:`user:${id}/edit` }
    ]);

    if (user === undefined) {
      channel.trigger("missing:item");
      return;
    }

    const OView = pwd === true ? EditPwdUserView : EditUserView;

    const view = new OView({
      title: pwd === true ? "Modification du mot de passe" : `Modification de ${user.get('prenom')} ${user.get('nom')}`,
      model: user,
      editorIsAdmin: isAdmin,
      errorCode: "028",
    });
    view.on("success", function (model, data) {
      channel.trigger("user:show", id);
    });
    new Region({ el: '#main-region' }).show(view);
  },

  NewUserView() {
    const channel = this.getChannel();
    channel.trigger("ariane:reset", [
      { text:"Utilisateurs", link:"users" },
      { text:"Nouvel utilisateur", link:"user/new" }
    ]);
    const isRoot = channel.request("logged:get").isRoot();
    const User = require('../entity.js').Item;
    const model = new User();
    const view = new NewUserView({
      model: model,
      ranks: isRoot ? 2 : 1,
      errorCode: "030"
    });
    view.on("success", (model, data) => {
      channel.trigger("user:show", model.get("id"));
    });
    new Region({ el: "#main-region" }).show(view);
  },

  classeSignin(idClasse, classe) {
    const channel = this.getChannel();
    if (!classe || !classe) {
      channel.trigger("popup:error", { title: "Erreur", message: "Données manquantes pour rejoindre la classe." });
      return;
    }
    channel.trigger("ariane:reset", [
      { text: "Rejoindre une classe", link: "classes/signin" },
      { text: classe.get("nom"), link: `user/classe:${idClasse}/signin` }
    ]);

    const logged = channel.request("logged:get");
    if (logged.isAdmin() || logged.isProf()) {
      channel.trigger("popup:error", { title: "Erreur", message: "Seuls les élèves ou les nouveaux utilisateurs peuvent rejoindre une classe." });
      return;
    }

    let view;
    if (logged.isEleve()) {
      view = new ClasseChange({
        classe: classe
      });
    } else {
      const User = require('../entity.js').Item;
      const user = new User({ idClasse: classe.get("id"), rank: "eleve" });
      view = new ClasseSignin({
        classe: classe,
        model: user
      });
    }
    new Region({ el: "#main-region" }).show(view);
    view.on("success", (data) => {
      channel.trigger("popup:info", {
        title: `Bienvenue ${data.prenom} ${data.nom}`,
        message: `Vous avez rejoint la classe ${classe.get("nom")}. Vous devez vous connecter.`
      });
      if (logged.isEleve()) {
        logged.trigger("destroy"); // déconnecte l'élève
      }
      channel.trigger("home:show");
    });
  }

});

export const controller = new Controller();
