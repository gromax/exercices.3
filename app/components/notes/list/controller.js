import { MnObject, Region } from 'backbone.marionette'

const Controller = MnObject.extend({
  channelName: 'app',
});

export const controller = new Controller();