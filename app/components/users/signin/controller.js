import { MnObject, Region } from 'backbone.marionette'
import { SigninClassesCollectionView, TestMdpView, SigninView } from 'apps/users/signin/signin_views.coffee'

const Controller = MnObject.extend({
  channelName: "app",
  showSignin(classes) {
    const channel = this.getChannel();
    const listClassesView = new SigninClassesCollectionView({
      collection: classes
    });

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
    new Region({ el: "#main-region" }).show(listClassesView);
  }
});

export const controller = new Controller();
