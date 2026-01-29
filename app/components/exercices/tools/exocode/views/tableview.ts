import _ from "underscore"
import { View } from 'backbone.marionette'
import table_tpl from '@templates/exercices/run/exercice-table.jst'

const TableView = View.extend({
    template: table_tpl,
    templateContext() {
        return {
            rowheaders: this.getOption("rowheaders"),
            colheaders: this.getOption("colheaders"),
            rows: this.getOption("rows")
        }
    },

    onRender():void {
        // debounced version pour éviter les boucles
        const debouncedCheck = _.debounce(() => this.checkOverflow(), 100)
        
        const resizeObserver = new ResizeObserver(() => {
            // utiliser requestAnimationFrame pour sortir du cycle de resize
            requestAnimationFrame(() => debouncedCheck())
        })
        
        const tableContainer = this.el.querySelector('.table-responsive')
        if (tableContainer) {
            resizeObserver.observe(tableContainer)
            this.on('before:destroy', () => resizeObserver.disconnect())
            
            // vérification initiale
            this.checkOverflow()
        }
    },

    checkOverflow():void {
        const container = this.el.querySelector('.table-responsive')
        const hint = this.el.querySelector('.overflow-hint')
        
        if (container && hint) {
            const isOverflowing = container.scrollWidth > container.clientWidth
            // utiliser classList.toggle pour éviter les modifications inutiles
            const shouldShow = isOverflowing
            if ((hint.style.display !== 'none') !== shouldShow) {
                hint.style.display = shouldShow ? 'block' : 'none'
            }
        }
    },
})

export default TableView