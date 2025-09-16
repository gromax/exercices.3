import { View } from 'backbone.marionette';
import notFound_tpl from '@templates/home/show/home-off.jst';

const NotFoundView = View.extend({
  className: "jumbotron",
  template: notFound_tpl
});

export { NotFoundView };