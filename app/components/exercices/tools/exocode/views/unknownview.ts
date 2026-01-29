import { View } from 'backbone.marionette'
import unknown_tpl from '@templates/exercices/run/exercice-unknown.jst'

const UnknownView = View.extend({
    template: unknown_tpl,
    templateContext() {
        return {
            name: this.getOption("name"),
            code: this.getOption("code")
        }
    }
})

export default UnknownView