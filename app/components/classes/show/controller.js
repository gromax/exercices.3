import { MnObject, Region } from 'backbone.marionette';
import { ShowClasseView, ClasseMotdepasseVerifyView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',
  show(id, classe) {
    const channel = this.getChannel();
    if (classe === undefined) {
      channel.trigger("ariane:add", { text: "Classe inconnue", e: "classe:show", data: id, link: `classe:${id}` });
      channel.trigger("missing:item");
      return;
    }
    channel.trigger("ariane:add", { text: classe.get("nom"), e: "classe:show", data: id, link: `classe:${id}` });
    view = new ShowClasseView({
      model: classe
    });
    view.on("classe:edit", (item) => {
      channel.trigger("classe:edit", item.get("id"));
    });
    new Region({ el: '#main-region' }).show(view);
  },

  showSigninClasses(classes) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    if (logged.isEleve()) {
      const idClasseEleve = logged.get("idClasse");
      classes = classes.filter( (c) => c.get("id") !== idClasseEleve );
    }
    const listClassesView = new SigninClassesCollectionView({
      collection: classes
    });
    listClassesView.on("item:join", (childView) => {
      channel.trigger("classe:motdepasse:verify", childView.model.get("id"));
    });
    new Region({ el: "#main-region" }).show(listClassesView);
  },

  showMotdepasseVerify(id, classe) {
    const channel = this.getChannel();
    if (classe === undefined) {
      channel.trigger("ariane:reset", [
        { text: "Rejoindre une classe", e: "classes:tojoin", data: null, link: `classe/tojoin` },
        { text: "Classe inconnue", e: "classe:motdepasse:verify", data: id, link: `classe:${id}/motdepasse` }
      ]);
      channel.trigger("missing:item");
      return;
    }
    channel.trigger("ariane:reset", [
      { text: "Rejoindre une classe", e: "classes:tojoin", data: null, link: `classe/tojoin` },
      { text: `Test du mot de passe pour ${classe.get("nom")}`, e: "classe:motdepasse:verify", data: id, link: `classe:${id}/motdepasse` }
    ]);
    const view = new ClasseMotdepasseVerifyView({
      model: classe
    });
    view.on("form:submit", (data) => {
      const testingMdp = classe.testClasseMdp(data.mdp);
      channel.trigger("loading:up");
      $.when(testingMdp).done( (data_test) => {
        channel.trigger("user:join:classe", data_test.classe, data_test.mdp);
      }).fail( (response) => {
        if (response.status === 422) {
          view.trigger("form:data:invalid", { mdp: "Mot de passe incorrect." });
        } else {
          channel.trigger("popup:error", { title:`Mot de passe de ${classe.get("nom")}`, message: `Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code ${response.status}/027]` });
        }
      }).always(() => {
        channel.trigger("loading:down");
      });
    });
    new Region({ el: "#main-region" }).show(view);
  }
});

export const controller = new Controller();
