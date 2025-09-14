import { MnObject, Region } from 'backbone.marionette';
import Radio from 'backbone.radio';
import { UsersPanel, UsersCollectionView } from '@apps/users/list/list_users_views.js';
//import { NewUserView, EditUserView, EditPwdUserView } from '@apps/users/edit/edit_user_views.js';
import { ListLayout } from '@apps/common/common_views.js';

const headerRadio = Radio.channel('header');
const commonRadio = Radio.channel('common');

const Controller = MnObject.extend ({
  channelName: 'navigation',
  listUsers(criterion) {
    const channel = this.getChannel();
    require('@entities/dataManager.js');
    headerRadio.trigger("loading:up");
    const fetchingUsers = channel.request("custom:entities", ["users"]);
    const logged = Radio.channel('session').request("logged");
    $.when(fetchingUsers).done((users) => {
      criterion = criterion || "";
      const usersListLayout = new ListLayout();
      const usersListPanel = new UsersPanel({
        filterCriterion: criterion,
        showAddButton: logged && logged.isAdmin()
      });
      const usersListView = new UsersCollectionView({
        collection: users,
        adminMode: logged && logged.isAdmin()
      });
      usersListView.trigger("set:filter:criterion", criterion, { preventRender: false });
      usersListPanel.on("items:filter", (filterCriterion) => {
        usersListView.trigger("set:filter:criterion", filterCriterion, { preventRender: false });
      });
      channel.trigger("users:filter", criterion);

      usersListLayout.on("render", () => {
        usersListLayout.getRegion('panelRegion').show(usersListPanel);
        usersListLayout.getRegion('itemsRegion').show(usersListView);
      });

      usersListPanel.on("user:new", () => {
        const User = require("@entities/users.js").Item;
        const newUser = new User();
        const newUserView = new NewUserView({
          model: newUser,
          listView: usersListView,
          ranks: logged && logged.isRoot() ? 2 : 1,
          errorCode: "030"
        });
        new Region({ el: "#dialog-region" }).show(newUserView);
      });

      usersListView.on("item:show", (childView, args) => {
        const model = childView.model;
        this.getChannel().trigger("user:show", model.get("id"));
      });

      usersListView.on("item:edit", (childView, args) => {
        const model = childView.model;
        const editView = new EditUserView({
          model: model,
          itemView: childView,
          errorCode: "031",
          editorIsAdmin: logged && logged.isAdmin()
        });

        new Region({ el: "#dialog-region" }).show(editView);
      });

      usersListView.on("item:editPwd", (childView, args) => {
        const model = childView.model;
        const editPwdView = new EditPwdUserView({
          model: model,
          itemView: childView,
          errorCode: "032"
        });

        new Region({ el: "#dialog-region" }).show(editPwdView);
      });

      usersListView.on("item:forgotten", (childView, e) => {
        const model = childView.model;
        const email = model.get("email");
        if (confirm(`Envoyer un mail de réinitialisation à « ${model.get('nomComplet')} » ?`)) {
          headerRadio.trigger("loading:up");
          const sendingMail = channel.request("forgotten:password", email);
          sendingMail.always(() =>
            headerRadio.trigger("loading:down")
          ).done((response) => {
            childView.trigger("flash:success");
          }).fail((response) => {
            alert(`Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code ${response.status}/034]`);
          });
        }
      });

      usersListView.on("item:sudo", (childView, e) => {
        const model = childView.model;
        headerRadio.trigger("loading:up");
        const connecting = logged && logged.sudo(model.get("id"));
        $.when(connecting).done((response) => {
          channel.trigger("home:show");
        }).fail((response) => {
          switch (response.status) {
            case 404:
              alert("Page inconnue !");
              break;
            case 403:
              alert("Non autorisé !");
              break;
            default:
              alert("Erreur inconnue.");
          }
        }).always(() =>
          headerRadio.trigger("loading:down")
        );
      });

      new Region({ el: "#main-region" }).show(usersListLayout);
    }).fail((response) => {
      commonRadio.trigger("data:fetch:fail", response);
    }).always(() => {
      headerRadio.trigger("loading:down");
    });
  },
});

export const controller = new Controller();
