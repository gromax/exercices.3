import { MnObject, Region } from 'backbone.marionette'
import { ClassesCollectionView, ClassesPanel, ListLayout } from './views.js'

const Controller = MnObject.extend({
  channelName: 'app',

  list(classes, prof = null) {
    const channel = this.getChannel();

    if (!prof) {
      channel.trigger("ariane:reset", [{ text: "Classes", link: "classes" }]);
    } else {
      channel.trigger("ariane:reset", [
        { text: "Classes", link: "classes" },
        { text: `Classes de ${prof.get("nomComplet")}`, link: `classes/prof:${prof.get("id")}` }
      ]);
    }

    const logged = channel.request("logged:get");
    const listItemsLayout = new ListLayout()
    const listItemsPanel = new ClassesPanel({
      addToProf: prof ? prof.get("nomComplet") : false,
      showAddButton: prof ? true : logged.isProf()
    });

    const listItemsView = new ClassesCollectionView({
      collection: classes,
      filterKeys: ["id", "nom", "prenom"],
      showFillClassButton: logged.isAdmin(),
      showProfName: !prof && logged.isAdmin()
    });

    listItemsLayout.on("render", () => {
      listItemsLayout.getRegion('panelRegion').show(listItemsPanel);
      listItemsLayout.getRegion('itemsRegion').show(listItemsView);
    });

    listItemsView.on("item:show", (childView) => {
      const model = childView.model;
      channel.trigger("classe:show", model.get("id"));
    });

    listItemsView.on("item:classes:prof", (childView) => {
      channel.trigger("classes:prof", childView.model.get("idOwner"));
    });

    listItemsView.on("item:edit", (childView) => {
      channel.trigger("classe:edit", childView.model.get("id"));
    });

    new Region({ el: "#main-region" }).show(listItemsLayout);
  }
});

export const controller = new Controller()
