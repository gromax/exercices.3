import { MnObject, Region } from 'backbone.marionette'
import { EditUserView, EditPwdUserView } from './edit_views.js'
import { NewUserView, ClasseSignin, ClasseChange } from './new_view.js';
import Ranks from '../../common/ranks.js'

const Controller = MnObject.extend ({
  channelName: "app",
  
  editUser(user, pwd) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!user) {
      channel.trigger("popup:error", "Utilisateur introuvable");
      return;
    }
    const isAdmin = channel.request("logged:get").isAdmin();
    const OView = pwd === true ? EditPwdUserView : EditUserView;
    const isMe = (logged.id === user.id);
    const titleMdp = isMe ? "Modification de votre mot de passe" : "Modification du mot de passe";
    const titleInfo = isMe ? "Modification de vos informations" : `Modification des informations de ${user.get('nomComplet')}`;
    const ranks = user.isEleve() || !logged.isRoot()
      ? false
      : [["Administrateur", Ranks.ADMIN], ["Professeur", Ranks.PROF]];
    const view = new OView({
      title: pwd === true ? titleMdp : titleInfo,
      model: user,
      editorIsAdmin: isAdmin,
      ranks: ranks,
      errorCode: "028",
    });
    view.on("success", (model, data) => {
      if (logged.id === model.id) {
        channel.request("logged:get").set(data); // met à jour nom, prénom et pref
      }
      channel.trigger("user:show", user.id);
    });
    channel.request("region:main").show(view);
  },

  NewUserView() {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const User = require('../entity.js').Item;
    const model = new User();
    const ranks = logged.isRoot()
      ? [["Administrateur", Ranks.ADMIN], ["Professeur", Ranks.PROF]]
      : [["Professeur", Ranks.PROF]];
    const view = new NewUserView({
      model: model,
      ranks: ranks,
    });
    view.on("success", (model, data) => {
      channel.trigger("data:collection:additem", "users", model);
      channel.trigger("user:show", model.get("id"));
    });
    channel.request("region:main").show(view);
  },

  classeSignin(classe) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (!classe) {
      channel.trigger("popup:error", { title: "Erreur", message: "Données manquantes pour rejoindre la classe." });
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
    channel.request("region:main").show(view);
    view.on("success", (user) => {
      channel.trigger("popup:info", {
        title: `Bienvenue ${user.get("prenom")} ${user.get("nom")}`,
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
