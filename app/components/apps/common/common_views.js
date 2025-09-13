import { View } from 'backbone.marionette'
import alert_tpl from 'templates/common/alert-view.jst'
import list_layout_tpl from 'templates/common/list-layout.jst'
import missing_item_tpl from 'templates/common/missing-item.jst'

const AlertView = View.extend ({
  tag: "div",
  type: "danger",
  title: "Erreur !",
  message: "Erreur inconnue. Reessayez !",
  dismiss:false,
  template: alert_tpl,
  className() {
    return `alert alert-${this.getOption('type')}`;
  },
  templateContext() {
    return {
      title: this.getOption("title"),
      message: this.getOption("message"),
      type: this.getOption("type"),
      dismiss: this.getOption("dismiss")
    };
  }
});

const MissingView = View.extend ({
  template: missing_item_tpl,
  message: "Cet item n'existe pas.",
  templateContext() {
    return {
      message: this.getOption("message")
    };
  }
});

const ListLayout = View.extend ({
  template: list_layout_tpl,
  regions: {
    panelRegion: "#panel-region",
    itemsRegion: "#items-region"
  }
});

export { AlertView, MissingView, ListLayout };
