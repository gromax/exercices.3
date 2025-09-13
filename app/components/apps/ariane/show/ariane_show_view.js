import { View, CollectionView } from 'backbone.marionette'
import { app } from '@components/App.js'
import item_tpl from '@templates/ariane/show/show-item.jst'
import ariane_tpl from '@templates/ariane/show/show-list.jst'
import not_loaded_tpl from '@templates/ariane/show/ariane-not-loaded-view.jst'

const NoView = View.extend({
  tagName: "li",
  className: "breadcrumb-item active",
  template: not_loaded_tpl
});

const ItemView = View.extend({
  tagName: "li",
  template: item_tpl,
  className() {
    if (this.model.get("active")){
      return "breadcrumb-item";
    } else {
      // Ça peut paraître bizarre, mais c'est quand il n'y a pas de lien
      // et que c'est inactif qu'il faut mettre la classe active avec bootstrap breadcrumb
      return "breadcrumb-item active";
    }
  },
  initialize() {
    this.listenTo(
      this.model,
      "change:active",
      function(){
        this.render();
      }
    );
  },
  triggers: {
    "click a.js-next" : "ariane:next",
    "click a.js-prev" : "ariane:prev",
    "click a.js-link" : "ariane:navigate"
  },
  onArianePrev() {
    event_name = this.model.get("e");
    data = this.model.get("prev");
    app.trigger.apply(app,_.flatten([event_name,data]));
  },
  onArianeNext() {
    event_name = this.model.get("e");
    data = this.model.get("next");
    app.trigger.apply(app,_.flatten([event_name,data]));
  },
  onArianeNavigate() {
    active = this.model.get("active");
    event_name = this.model.get("e");
    data = this.model.get("data");
    if (active && event_name){
      app.trigger.apply(app,_.flatten([event_name,data]));
    }
  }
});

const FilView = CollectionView.extend({
  tagName:"ol",
  className: "breadcrumb",
  childViewEventPrefix: "item",
  childView: ItemView,
  emptyView: NoView
});

const ArianeView = View.extend({
  tagName: "nav",
  template: ariane_tpl,
  regions: {
    body: {
      el:'ol',
      replaceElement:true
    }
  },
  onRender() {
    this.subCollection = new FilView({
      collection: this.collection
    });
    this.showChildView('body', this.subCollection);
  }
});

export { ArianeView }
