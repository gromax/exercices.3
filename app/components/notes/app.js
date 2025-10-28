import Backbone from "backbone";
import {MnObject} from "backbone.marionette"

const Controller = MnObject.extend({
  channelName: "app",
  radioEvents: {
  },
});

const controller = new Controller();

const Router = Backbone.Router.extend({
  routes: {
  },
});

const router = new Router();
