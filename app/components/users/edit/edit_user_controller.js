import { MnObject } from 'backbone.marionette'
import { EditUserView, EditPwdUserView } from 'apps/users/edit/edit_user_views.coffee'
import { app } from 'app'

Controller = MnObject.extend {
  channelName: "entities"
  editUser: (id, isMe, isAdmin, pwd) ->
    if pwd is true
      text="Modification du mot de passe"
      trigger="user:editPwd"
    else
      textLink="Modification"
      trigger="user:edit"

    app.trigger "loading:up"
    channel = @getChannel()
    require('entities/dataManager.coffee')
    if isMe
      fetchingUser = channel.request("user:me")
    else
      fetchingUser = channel.request("user:entity", id)
    $.when(fetchingUser).done( (user)->
      if user isnt undefined
        if isMe
          id = user.get("id")
          app.Ariane.add [
            { text:"Mon compte", e:"user:show", data:user.get("id"), link:"user:#{id}" }
            { text:textLink, e:trigger, data:user.get("id"), link:"user:#{id}/edit" }
          ]
        else
          app.Ariane.add [
            { text:user.get("nomComplet"), e:"user:show", data:user.get("id"), link:"user:"+user.get("id") }
            { text:textLink, e:trigger, data:user.get("id"), link:"user:"+user.get("id")+"/edit" }
          ]

        if pwd is true
          OView = EditPwdUserView
        else
          OView = EditUserView

        view = new OView {
          model: user
          generateTitle: true
          editorIsAdmin: isAdmin
          errorCode: "028"
          onSuccess: (model, data)->
            if isMe
              app.Auth.set(data) # met à jour nom, prénom et pref
            app.trigger "user:show", model.get("id")
        }
        app.regions.getRegion('main').show(view)
      else
        if isMe
          app.Ariane.add [
            { text:"Mon compte", e:"user:show", data:id, link:"user:#{id}" }
            { text:textLink, e:trigger, data:id, link:"user:#{id}/edit" }
          ]
        else
          app.Ariane.add [
            { text:"Utilisateur inconnu", e:"user:show", data:id, link:"user:"+id }
            { text:textLink, e:trigger, data:id, link:"user:"+id+"/edit" }
          ]
        app.trigger "not:found"
    ).fail( (response)->
      app.trigger "data:fetch:fail", response
    ).always( ->
      app.trigger "loading:down"
    )

}

export controller = new Controller()
