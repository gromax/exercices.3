import { MnObject, Region } from 'backbone.marionette';
import { UsersPanel, UsersCollectionView } from './views.js';
import { LayoutView } from '../../common/views.js';

const Controller = MnObject.extend ({
  channelName: 'app',
  listUsers(users, classe = null) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const that = this;
    const usersListLayout = new LayoutView( { panelRight: true } );
    const usersListPanel = new UsersPanel({
      filterCriterion: "",
      showAddButton: logged.isAdmin()
    });
    const usersListView = new UsersCollectionView({
      collection: users,
      adminMode: logged.isAdmin(),
      showClasse: classe === null
    });

    usersListPanel.on("items:filter", (filterCriterion) => {
      usersListView.trigger("set:filter:criterion", filterCriterion, { preventRender: false });
    });

    usersListLayout.on("render", () => {
      usersListLayout.getRegion('panelRegion').show(usersListPanel);
      usersListLayout.getRegion('contentRegion').show(usersListView);
    });

    /*usersListPanel.on("user:new", () => {
      const view = channel.request("new:user:modal");
      view.on("success", (model, data) => {
        usersListView.collection.add(model);
        usersListView.children.findByModel(model)?.trigger("flash:success");
      });
    });*/

    usersListView.on("item:classe", (childView) => {
      const model = childView.model;
      channel.trigger("users:classe:show", model.get("idClasse"));
    });
    usersListView.on("item:show", (childView, args) => {
      const model = childView.model;
      channel.trigger("user:show", model.get("id"));
    });

    usersListView.on("item:forgotten", (childView, e) => {
      const model = childView.model;
      const email = model.get("email");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        channel.trigger("popup:alert", "L'utilisateur n'a pas d'email valide enregistré.");
        return;
      }
      if (confirm(`Envoyer un mail de réinitialisation à « ${model.get('nomComplet')} » ?`)) {
        channel.trigger("loading:up");
        const sendingMail = channel.request("forgotten:password", email);
        sendingMail.done((response) => {
          childView.trigger("flash:success");
        }).fail((response) => {
          channel.trigger("popup:alert", `Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code ${response.status}/034]`);
        }).always(() => {
          channel.trigger("loading:down");
        });
      }
    });

    usersListView.on("item:sudo", (childView, e) => {
      const model = childView.model;
      that.sudo(model.get("id"));
    });

    channel.request("region:main").show(usersListLayout);
  },

  sudo(id) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    channel.trigger("loading:up");
    const connecting = logged && logged.sudo(id);
    $.when(connecting).done( (data) => {
      channel.trigger("home:show");
    }).fail( (response) => {
      switch (response.status) {
        case 404:
          channel.trigger("popup:alert", "Page inconnue !");
          break;
        case 403:
          channel.trigger("popup:alert", "Non autorisé !");
          break;
        default:
          channel.trigger("popup:alert", `Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code ${response.status}/035]`);
      }
    }).always( () => {
      channel.trigger("loading:down");
    });
  },
});

export const controller = new Controller();
