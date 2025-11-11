import { View, CollectionView } from 'backbone.marionette'
import { FilterList, FilterPanel } from '../../behaviors.js'

import panel_tpl from 'templates/exercices/list/exercice-list-panel.jst'
import no_exercice_view_tpl from 'templates/exercices/list/exercice-list-none.jst'
import exercice_item_view_tpl from 'templates/exercices/list/exercice-list-item.jst'
import exercices_list_layout_tpl from '@templates/exercices/list/exercices-list-layout.jst';

const ListLayout = View.extend ({
  template: exercices_list_layout_tpl,
  regions: {
    panelRegion: "#panel-region",
    itemsRegion: "#items-region"
  }
});

const ExercicesPanel = View.extend({
  template: panel_tpl,
  behaviors: [FilterPanel],
  templateContext() {
    return {
      filterCriterion: this.getOption("filterCriterion"),
      showAddButton: this.getOption("showAddButton")
    };
  }
});

const NoExerciceView = View.extend({
  template: no_exercice_view_tpl,
  tagName: "a",
  className: "list-group-item"
});

const ExerciceItemView = View.extend({
  tagName: "a",
  className() {
    if (!this.model.get('published')) {
      return "list-group-item list-group-item-warning";
    }
    return "list-group-item";
  },
  template: exercice_item_view_tpl,
  triggers: {
    "click": "sujet:exercice:show"
  },
  onRender() {
    // MathJax.Hub.Queue(["Typeset",MathJax.Hub,this.$el[0]])
  }
});

const ExercicesCollectionView = CollectionView.extend({
  className: "list-group",
  emptyView: NoExerciceView,
  childView: ExerciceItemView,
  childViewEventPrefix: "item",
  behaviors: [FilterList],
  filterKeys: ["title", "description", "keywords"]
});

export { ListLayout, ExercicesPanel, ExercicesCollectionView }
