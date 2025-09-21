import { MnObject, Region } from 'backbone.marionette'
import { ClassesCollectionView, ClassesPanel, ListLayout } from './views.js'

const Controller = MnObject.extend({
  channelName: 'app',

  list(classes, prof = false) {
    const channel = this.getChannel();
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

    if (prof) {
      channel.trigger("ariane:add", [
        { text: `Classes de ${prof.get("nomComplet")}`, e: "classes:prof", data: id, link: `classes/prof:${id}` }
      ]);
      listItemsView.trigger("set:filter:criterion", prof.get("id") + prof.get("nom") + prof.get("prenom"), { preventRender: true });
    }

    listItemsLayout.on("render", () => {
      listItemsLayout.getRegion('panelRegion').show(listItemsPanel);
      listItemsLayout.getRegion('itemsRegion').show(listItemsView);
    });

    listItemsPanel.on("classe:new", () => {
        const view = channel.request("new:classe:modal");
        view.on("success", (model, resp) => {
          listItemsView.collection.add(model);
          listItemsView.children.findByModel(model)?.trigger("flash:success");
        });
    });

    if (!prof) {
      // en mode classe/prof, je ne permet pas la navigation qui serait de toute façon déroutante
      listItemsView.on("item:show", (childView) => {
        const model = childView.model;
        channel.trigger("classe:show", model.get("id"));
      });
    }

    listItemsView.on("item:classes:prof", (childView) => {
      channel.trigger("classes:prof", childView.model.get("idOwner"));
    });

    listItemsView.on("item:fill", (childView) => {
      channel.trigger("popup:info", {
        title:"Remplissage d'une classe",
        message: "Le remplissage d'une classe n'est pas encore implémenté."
      });
      /*
      const model = childView.model;
      const view = new FillClasseView({
        nomProf: model.get("nomOwner"),
        itemView: childView,
        errorCode: "003"
      });
      */
    });

    listItemsView.on("item:edit", (childView) => {
      channel.trigger("classe:edit", childView.model.get("id"));
    });

    new Region({ el: "#main-region" }).show(listItemsLayout);
  }


});

export const controller = new Controller()
