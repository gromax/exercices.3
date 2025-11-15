import { View } from 'backbone.marionette'
import twocols_tpl from '@templates/common/twocols.jst'
import layout_tpl from '@templates/common/layout.jst'

const TwoColsView = View.extend({
  template: twocols_tpl,
  regions: {
    left: '.js-left',
    right: '.js-right'
  }
});

const LayoutView = View.extend ({
  template: layout_tpl,
  templateContext() {
    return {
      panelRight: this.getOption('panelRight') || false
    };
  },
  regions: {
    panelRegion: ".js-panel",
    contentRegion: ".js-content"
  }
});

export { TwoColsView, LayoutView };