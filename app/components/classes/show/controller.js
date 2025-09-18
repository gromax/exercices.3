import { MnObject, Region } from 'backbone.marionette';
import { ShowClasseView } from './views.js';

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
    
    new Region({ el: "#main-region" }).show(listClassesView);
    // le morceau qui suit doit être déplacé comme un trigger dans l'app
    listClassesView.on("item:join", (childView) => {
      const classe = childView.model;
      const User = require("../entity.js").Item;
      const newUser = new User({ nomClasse: classe.get("nom"), idClasse: classe.get("id") });
      const mdp_view = new TestMdpView({ model: newUser });

      mdp_view.on("form:submit", (data_test) => {
        const testingMdp = newUser.testClasseMdp(data_test.mdp);
        channel.trigger("loading:up");
        $.when(testingMdp).done(() => {
          newUser.set("classeMdp", data_test.mdp);
          mdp_view.trigger("dialog:close");
          signin_eleve_view = new SigninView({ model: newUser });
          signin_eleve_view.on("model:save:success", (model) => {
            channel.trigger("home:show");
            channel.trigger("show:message:success", {
              title: "Inscription réussie",
              message: "Vous avez créé un compte. Vous pouvez maintenant vous connecter."
            });
          });
          channel.trigger("dialog:show", signin_eleve_view);
        }).fail((response) => {
          if (response.status === 422) {
            mdp_view.trigger("form:data:invalid", { mdp: "Mot de passe incorrect." });
          } else {
            alert("Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code #{response.status}/027]");
          }
        }).always(() => {
          channel.trigger("loading:down");
        });
      });
      channel.trigger("dialog:show", mdp_view);
    });
    
  },
});

export const controller = new Controller();
