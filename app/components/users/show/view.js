import { View } from 'backbone.marionette'
import show_user_tpl from '@templates/users/show/show-user.jst'


const ShowUserView = View.extend ({
  template: show_user_tpl,
  triggers: {
    "click a.js-edit": "click:edit",
    "click a.js-editPwd": "click:edit:pwd"
  }
});

export { ShowUserView };
