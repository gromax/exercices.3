import { MnObject, Region } from 'backbone.marionette';
import { UsersPanel, UsersCollectionView, ListLayout } from './views.js';

const Controller = MnObject.extend ({
  channelName: 'app',
  listUsers(users, rank, criterion) {
    const channel = this.getChannel();
    criterion = criterion || "";
    const usersListLayout = new ListLayout();
    const usersListPanel = new UsersPanel({
      filterCriterion: criterion,
      showAddButton: (rank == "root") || (rank == "admin")
    });
    const usersListView = new UsersCollectionView({
      collection: users,
      adminMode: (rank == "admin") || (rank == "root")
    });

    usersListView.trigger("set:filter:criterion", criterion, { preventRender: false });
    usersListPanel.on("items:filter", (filterCriterion) => {
      usersListView.trigger("set:filter:criterion", filterCriterion, { preventRender: false });
      Backbone.history.navigate(`users/filter/criterion:${filterCriterion}`, {});
    });

    usersListLayout.on("render", () => {
      usersListLayout.getRegion('panelRegion').show(usersListPanel);
      usersListLayout.getRegion('itemsRegion').show(usersListView);
    });

    usersListPanel.on("user:new", () => {
      const view = channel.request("new:user:modal");
      view.on("success", (model, data) => {
        usersListView.collection.add(model);
        usersListView.children.findByModel(model)?.trigger("flash:success");
      });
    });

    usersListView.on("item:show", (childView, args) => {
      const model = childView.model;
      channel.trigger("user:show", model.get("id"));
    });

    usersListView.on("item:forgotten", (childView, e) => {
      const model = childView.model;
      const email = model.get("email");
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
      channel.trigger("user:sudo", model.get("id"));
    });

    new Region({ el: "#main-region" }).show(usersListLayout);
  },
});

export const controller = new Controller();
