import { MnObject, Region } from 'backbone.marionette'
import { FichesPanel, FichesCollectionView, ListLayout } from './views.js'
import { NewFicheView } from '../edit/views.js'
import { app } from 'app'

const Controller = MnObject.extend({
  channelName: 'app',
  list() {
    const channel = this.getChannel();
    const logged = channel.request("auth:logged");
    channel.trigger("loading:up");
    require('entities/dataManager.coffee');
    const fetchingFichesList = channel.request("custom:entities",["fiches"])
    $.when(fetchingFichesList).done( (fiches) => {
      const listItemsView = new FichesCollectionView({
        collection: fiches,
        adminMode: logged.isAdmin(),
        showInactifs: app.settings.showFichesInactifs === true
      });
      const listItemsLayout = new ListLayout();
      const panel = new FichesPanel({
        adminMode: logged.isAdmin(),
        showInactifs: app.settings.showFichesInactifs === true
      });
      listItemsLayout.on("render", () => {
        listItemsLayout.getRegion('panelRegion').show(panel);
        listItemsLayout.getRegion('itemsRegion').show(listItemsView);
      });

      panel.on("fiche:new", () => {
        Item = require("entities/fiches.coffee").Item;
        const newItem = new Item();
        const newItemView = new NewFicheView({
          model: newItem,
          listView: listItemsView,
          errorCode: "020"
        });
        new Region({ el:"#dialog-region" }).show(newItemView);
      });

      panel.on("fiche:toggle:showInactifs", () => {
        alert("non implémenté");
      });

      listItemsView.on("item:show", (childView, args) => {
        channel.trigger("fiche:show", childView.model.get("id"));
      });

      listItemsView.on("item:toggle:activity", (childView) => {
        childView.trigger("toggle:attribute", "actif");
      });

      listItemsView.on("item:toggle:visibility", (childView) => {
        childView.trigger("toggle:attribute", "visible");
      });
      new Region({ el:"#main-region" }).show(listItemsLayout);
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  },
});

export const controller = new Controller();
