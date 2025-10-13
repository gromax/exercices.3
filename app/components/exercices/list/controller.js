import { MnObject, Region } from 'backbone.marionette'
import { ListLayout, ExercicesPanel, ExercicesCollectionView } from './views.js'

const Controller = MnObject.extend({
  channelName: "app",
  list(exercices, criterion) {
    criterion = criterion ? "" : "";
    const layout = new ListLayout();
    const panel = new ExercicesPanel({ filterCriterion: criterion });
    const channel = this.getChannel();

    const listExercicesView = new ExercicesCollectionView({
      collection: exercices,
      filterCriterion: criterion
    });

    panel.on("items:filter", (filterCriterion) => {
      listExercicesView.trigger("set:filter:criterion", filterCriterion, { preventRender: false });
      channel.trigger("exercices:filter", filterCriterion);
    });

    layout.on("render", () => {
      layout.getRegion('panelRegion').show(panel);
      layout.getRegion('itemsRegion').show(listExercicesView);
    });

    listExercicesView.on("item:sujet:exercice:show", (childView) => {
      channel.trigger("sujet:exercice:show", childView.model.get("id"));
    });

    new Region({ el:"#main-region" }).show(layout);
  }
});

export const controller = new Controller();
