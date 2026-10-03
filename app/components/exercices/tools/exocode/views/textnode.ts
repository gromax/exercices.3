import { View } from 'backbone.marionette'
import text_tpl from '@templates/exercices/bloc/textnode.jst'

const TextNodeView = View.extend({
    template: text_tpl,
    templateContext() {
        return {
            text: this.getOption("text") || '',
            style: this.getOption("style") || ''
        }
    }
})

export default TextNodeView