import { View, CollectionView } from 'backbone.marionette'
import { Form, ToggleItemValue, DestroyWarn, FlashItem, SortList, FilterList, FilterPanel } from 'apps/common/behaviors.coffee'
import layout_tpl from '@templates/fiches/edit/edit-fiche-layout.jst'
import edit_fiche_description_tpl from '@templates/fiches/edit/fiche-description-edit.jst'
import show_fiche_description_tpl from '@templates/fiches/edit/fiche-description-show.jst'
import devoir_list_none_tpl from '@templates/fiches/edit/devoirs-list-none.jst'
import devoir_item_view_tpl from '@templates/fiches/edit/devoirs-list-item.jst'
import devoir_list_view_tpl from '@templates/fiches/edit/devoirs-list.jst'
import eleve_list_none_tpl from '@templates/fiches/edit/add-devoir-eleve-none.jst'
import eleve_item_view_tpl from '@templates/fiches/edit/add-devoir-eleve-item.jst'
import eleve_list_view_tpl from '@templates/fiches/edit/add-devoir-eleves-list.jst'
import add_devoir_panel_tpl from '@templates/fiches/edit/add-devoir-panel.jst'
import tabs_panel_tpl from '@templates/fiches/edit/tabs-panel.jst'
import exam_panel_tpl from '@templates/fiches/edit/exam-panel.jst'
import exam_list_none_tpl from '@templates/fiches/edit/exam-list-none.jst'
import exam_list_item_tpl from '@templates/fiches/edit/exam-list-item.jst'
import exam_list_tpl from '@templates/fiches/edit/exam-list.jst'
import exam_edit_tpl from '@templates/fiches/edit/exam-edit.jst'

const FicheLayout = View.extend({
  template: layout_tpl,
  regions: {
    tabsRegion: "#tabs-region",
    panelRegion: "#panel-region",
    contentRegion: "#content-region"
  }
});

const NewFicheView = View.extend({
  title: "Nouvelle fiche",
  template: edit_fiche_tpl,
  behaviors: [Form]
});

const EditFicheDescriptionView = View.extend({
  template: edit_fiche_description_tpl,
  behaviors: [Form],
  title: "Modifier le fiche",
  generateTitle: false,
  onRender() {
    if (this.getOption("generateTitle")) {
      const $title = $("<h1>", { text: this.title });
      this.$el.prepend($title);
    }
  }
});

const ShowFicheDescriptionView = View.extend({
  template: show_fiche_description_tpl,
  triggers: {
    "click a.js-edit": "edit"
  }
});

const TabsPanel = View.extend({
  template: tabs_panel_tpl,
  panel: 0,
  triggers: {
    "click a.js-description": "tab:description",
    "click a.js-exercices": "tab:exercices",
    "click a.js-notes": "tab:notes",
    "click a.js-eleves": "tab:eleves",
    "click a.js-exams": "tab:exams"
  },
  templateContext() {
    return {
      panel: this.getOption("panel")
    };
  },
  setPanel: (panel) => {
    this.options.panel = panel;
    const $tabs = this.$el.find("a.nav-link");
    $tabs.removeClass("active");
    $tabs[panel].addClass("active");
  }
});

/*---------------------------
    views pour liste devoirs -
---------------------------*/
  
const NoDevoirView = View.extend({
  template: devoir_list_none_tpl,
  tagName: "tr",
  className: "alert"
});

const DevoirItemView = View.extend({
  tagName: "tr",
  errorCode: "???",
  template: devoirs-list-item,
  behaviors: [
    ToggleItemValue,
    DestroyWarn,
    FlashItem
  ],
  templateContext() {
    const data = _.clone(this.model.attributes);
    const note = String(this.model.calcNote(this.getOption("exofiches"), this.getOption("faits"), this.getOption("notation")));
    if (note.length === 1) {
      note = `0${note}`;
    }
    return { note };
  },
  triggers: {
    "click button.js-actif": "toggle:activity",
    "click": "show"
  }
});

const DevoirsCollectionView = CollectionView.extend({
  tagName: "table",
  className: "table table-hover",
  template: devoirs-list,
  childView: DevoirItemView,
  emptyView: NoDevoirView,
  childViewEventPrefix: "item",
  childViewContainer: "tbody",
  behaviors: [SortList],
  childViewOptions(model, index) {
    return {
      exofiches: this.getOption("exofiches"),
      faits: this.getOption("faits"),
      notation: this.getOption("notation")
    };
  },
  viewFilter(view, index, children) {
    return view.model.get("idFiche") === this.getOption("idFiche");
  }
});

//------------------------
// views pour add devoir -
//------------------------

const NoEleveView = View.extend({
  template: eleve_list_none_tpl,
  tagName: "tr",
  className: "alert"
});

const EleveItemView = View.extend({
  tagName: "tr",
  counter: 0,
  template: eleve_item_view_tpl,
  triggers: {
    "click button.js-addDevoir": "item:add"
  },
  templateContext: () => {
    return {
      counter: this.getOption("counter")
    };
  },
  onUpCounter: () => {
    this.options.counter = this.getOption("counter") + 1;
  }
});

const ElevesCollectionView = CollectionView.extend({
  tagName: "table",
  className: "table table-hover",
  template: eleve_list_view_tpl,
  childView: EleveItemView,
  emptyView: NoEleveView,
  behaviors: [SortList, FilterList],
  childViewEventPrefix: "item",
  childViewContainer: "tbody",
  filterKeys: ["nom", "prénom", "nomClasse"],

  initialize() {
    // on fait un préfiltrage des devoirs pour accélerer le comptage pour chaque élève
    this.options.devoirs = this.getOption("devoirs").where({ idFiche: this.getOption("idFiche") });
  },

  childViewOptions(model, index) {
    return {
      counter: _.where(this.options.devoirs, { idUser: model.get("id") }).length
    };
  }
});

const AddDevoirPanel = View.extend({
  template: add_devoir_panel_tpl,
  behaviors: [FilterPanel]
});

//-------------------
// views pour exams -
//-------------------

const ExamPanel = View.extend({
  template: exam_panel_tpl,
  triggers: {
    "click button.js-new": "exam:new"
  }
});

const NoExamView = View.extend({
  template: exam_list_none_tpl,
  tagName: "tr",
  className: "alert"
});

const ExamItemView = View.extend({
  tagName: "tr",
  errorCode: "???",
  template: exam_list_item_tpl,
  behaviors: [DestroyWarn, ToggleItemValue, FlashItem],
  triggers: {
    "click button.js-edit": "edit",
    "click button.js-lock": "item:lock",
    "click": "item:show"
  }
});

const ExamsCollectionView = CollectionView.extend({
  tagName: "table",
  className:"table table-hover",
  template: exam_list_tpl,
  childView: ExamItemView,
  emptyView: NoExamView,
  childViewEventPrefix: "item",
  behaviors: [SortList],
  filterView(child, index, collection) {
    // On affiche que les exofiches qui ont sont dans la bonne fiche
    return child.get("idFiche") === this.getOption("idFiche");
  }
});

const ExamEditView = View.extend({
  title: "Modification",
  behaviors: [Form],
  template: exam_edit_tpl
});

export { FicheLayout, NewFicheView, EditFicheDescriptionView, ShowFicheDescriptionView, TabsPanel, DevoirsCollectionView, ElevesCollectionView, AddDevoirPanel, ExamsCollectionView, ExamPanel, ExamEditView }
