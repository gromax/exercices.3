import { Behavior } from 'backbone.marionette';
import Radio from 'backbone.radio';

const radioApp = Radio.channel("app");

const SortList = Behavior.extend({
  events: {
    "click a.js-sort":"sortFct"
  },

  sortFct(e) {
    e.preventDefault();
    this.view.$el.find(".js-sort-icon").remove();
    let $sortEl = $(e.currentTarget);
    let tag = $sortEl.data("sort");
    let collection = this.view.collection;
    if (collection.comparatorAttr === tag) {
      $sortEl.append("<span class='js-sort-icon' style='margin-left: 5px;'><i class='fa fa-sort-amount-desc'></i></span>");
      collection.comparatorAttr = `inv_${tag}`;
      collection.comparator = function(a,b) {
        if (a.get(tag)>b.get(tag)) {
          return -1;
        } else {
          return 1;
        }
      };
    } else {
       $sortEl.append("<span class='js-sort-icon' style='margin-left: 5px;'><i class='fa fa-sort-amount-asc'></i></span>");
       collection.comparatorAttr = tag;
       collection.comparator = tag;
    }
    collection.sort();
  }
});

const FilterList = Behavior.extend({
  initialize() {
    if ((typeof this.view.options.filterCriterion !== "undefined") && (this.options.filterCriterion !== "")) {
      this.trigger("set:filter:criterion", this.view.options.filterCriterion, { preventRender: true });
    }
  },
  onSetFilterCriterion(criterion, options) {
    criterion = criterion.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if ((criterion === "") || (typeof this.view.getOption("filterKeys") === "undefined")) {
      this.view.removeFilter(options);
    } else {
      let filterKeys = this.view.getOption("filterKeys");
      let parseFct = function(model){
        const reductionFct = function(m,k) {
          return m+model.get(k);
        }
        return _.reduce(filterKeys, reductionFct, "").normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
      };
      let filterFct = function(view, index, children) {
        return parseFct(view.model).indexOf(criterion) !== -1;
      };
      this.view.setFilter(filterFct, options);
    }
  }
});

const FlashItem = Behavior.extend({
  onFlashSuccess() {
    this.flash("success");
  },
  onFlashError() {
    this.flash("danger");
  },
  flash(cssClass) {
    let $view = this.$el;
    let preCss;
    if (this.view.tagName === "tr") {
      preCss = "table-"; // dans Bootstrap
    } else {
      preCss = "";
    }
    $view.hide().toggleClass(preCss+cssClass).fadeIn(800, function(){
      setTimeout( function(){ $view.toggleClass(preCss+cssClass); }, 500);
    });
  }
});

const ToggleItemValue = Behavior.extend({
  onToggleAttribute(attributeName) {
    let model = this.view.model;
    let attributeValue = model.get(attributeName);
    model.set(attributeName, !attributeValue);
    let updatingItem = model.save();
    let self = this;
    if (updatingItem) {
      radioApp.trigger("loading:up");
      $.when(updatingItem).done( function(){
        self.view.render();
        self.view.trigger("flash:success");
      }).fail( function(response) {
        if (response.status === 401) {
          alert("Vous devez vous (re)connecter !");
          radioApp.trigger("home:logout");
        } else {
          let errorCode = self.view.getOption("errorCode");
          if (errorCode) {
            errorCode = `/${errorCode}`
          } else {
            errorCode = ""
          }
          alert(`Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code ${response.status}${errorCode}]`);
        }
      }).always( function(){
        radioApp.trigger("loading:down");
      });
    } else {
      this.view.trigger("flash:error");
    }
  }
});



const FilterPanel = Behavior.extend({
  ui: {
    criterion: "input.js-filter-criterion",
    form: "#filter-form",
  },
  events: {
    "submit @ui.form": "applyFilter",
  },

  applyFilter(e) {
    e.preventDefault();
    let criterion = this.ui.criterion.val();
    this.view.trigger("items:filter", criterion);
  },
  onSetFilterCriterion(criterion) {
    this.ui.criterion.val(criterion);
  }
});

export { SortList, FilterList, FlashItem, ToggleItemValue, FilterPanel }
