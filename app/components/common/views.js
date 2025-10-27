import { View } from 'backbone.marionette'
import twocols_tpl from '@templates/common/twocols.jst'

const TwoColsView = View.extend({
  template: twocols_tpl,
  regions: {
    left: '.js-left',
    right: '.js-right'
  }
});

export { TwoColsView };