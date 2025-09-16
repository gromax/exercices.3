import { View, CollectionView } from 'backbone.marionette'
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
    "click a.js-link" : "click:link"
  },
  onArianePrev() {
    const event_name = this.model.get("e");
    const data = this.model.get("prev");
    this.trigger("navigation", event_name, data);
  },
  onArianeNext() {
    const event_name = this.model.get("e");
    const data = this.model.get("next");
    this.trigger("navigation", event_name, data);
  },
  onClickLink() {
    const active = this.model.get("active");
    const event_name = this.model.get("e");
    const data = this.model.get("data");
    if (active && event_name){
      this.trigger("navigation", event_name, data);
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
    this.subCollection.on("item:navigation", (event_name, data) => {
      this.trigger("navigation", event_name, data);
    });
    this.showChildView('body', this.subCollection);
  }
});

export { ArianeView }
