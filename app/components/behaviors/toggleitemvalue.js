import { Behavior } from 'backbone.marionette'
import Radio from 'backbone.radio'
const radioApp = Radio.channel("app")

const ToggleItemValue = Behavior.extend({
    onToggleAttribute(attributeName) {
        const model = this.view.model
        const attributeValue = model.get(attributeName)
        model.set(attributeName, !attributeValue)
        const updatingItem = model.save()
        const self = this
        if (updatingItem) {
            radioApp.trigger("loading:up")
            $.when(updatingItem).done( function(){
                self.view.render()
                self.view.trigger("flash:success")
            }).fail( function(response) {
                if (response.status === 401) {
                    alert("Vous devez vous (re)connecter !")
                    radioApp.trigger("session:logout")
                } else {
                    alert(`Erreur inconnue. Essayez à nouveau ou prévenez l'administrateur [code ${response.status}]`)
                }
            }).always( function(){
                radioApp.trigger("loading:down")
            })
        } else {
            this.view.trigger("flash:error")
        }
    }
})

export default ToggleItemValue
