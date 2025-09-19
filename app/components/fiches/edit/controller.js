import { MnObject, Region } from 'backbone.marionette'
import { FicheLayout, TabsPanel, ShowFicheDescriptionView } from './views.js'

const Controller = MnObject.extend({
  channelName: "app",
  linkTabsEvents(tabs, tabindex) {
    const channel = this.getChannel();
    if (tabindex !== 0) {
      tabs.on("tab:description", () => {
        channel.trigger("devoir:showDescription", id);
      });
    }
    if (tabindex !== 1) {
      tabs.on("tab:exercices", () => {
        channel.trigger("devoir:showExercices", id);
      });
    }
    if (tabindex !== 2) {
      tabs.on("tab:notes", () => {
        channel.trigger("devoir:showUserfiches", id);
      });
    }
    if (tabindex !== 3) {
      tabs.on("tab:eleves", () => {
        channel.trigger("devoir:addUserfiche", id);
      });
    }
    if (tabindex !== 4) {
      tabs.on("tab:exams", () => {
        channel.trigger("devoir:exams", id);
      });
    }
  },

  showDescription(id) {
    // vue des paramètres du devoir lui même
    const channel = this.getChannel();
    channel.trigger("loading:up");
    const layout = new FicheLayout();
    const tabs = new TabsPanel({ panel: 0 });
    this.linkTabsEvents(tabs);
    layout.on("render", () => {
      layout.getRegion("tabsRegion").show(tabs);
    });
    new Region({ el:"#main-region" }).show(layout);
    require("entities/dataManager");
    const fetchingData = channel.request("custom:entities", ["fiches"]);
    $.when(fetchingData).done((fiches) => {
      const fiche = fiches.get(id);
      if (fiche) {
        const view = new ShowFicheDescriptionView({
          model: fiche
        });
        view.on("edit", () => {
          channel.trigger("fiche:edit", id);
        });
        layout.getRegion("contentRegion").show(view);
      } else {
        channel.trigger("not:found");
      }
    }).fail((response) => {
      channel.trigger("data:fetch:fail", response);
    }).always(() => {
      channel.trigger("loading:down");
    });
  }
});

export const controller = new Controller()
