import { MnObject, Region } from 'backbone.marionette';
import { SigninView } from './view.js';

const Controller = MnObject.extend({
  channelName: 'app',

  joinClasse(classe, mdp) {
    const channel = this.getChannel();
    if (!classe || !mdp) {
      channel.trigger("popup:error", { title: "Erreur", message: "Données manquantes pour rejoindre la classe." });
      return;
    }
    const logged = channel.request("logged:get");
    if (logged.isAdmin()||logged.isProf()) {
      channel.trigger("popup:error", { title: "Erreur", message: "Seuls les élèves ou les nouveaux utilisateurs peuvent rejoindre une classe." });
      return;
    }
    // Il faut encore créer la vue
    /*const view = new SigninView({
      model: classe
    });
    view.on("form:submit", (data) => {
      channel.trigger("classe:join", { classe: classe, mdp: data.mdp });
    });
    new Region({ el: "#main-region" }).show(view);*/
  }
});

export const controller = new Controller();
