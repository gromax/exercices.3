import { View } from 'backbone.marionette';
import { SVG } from '@svgdotjs/svg.js';
import tkztabview_tpl from '@templates/exercices/bloc/tkztab.jst'
import renderTexInDomElement from '@common/rendertex';

const TkzTabView = View.extend({
    template: tkztabview_tpl,
    events: {
        'click .js-varline-button': 'onClickTabvar',
        'click .js-signline-button': 'onClickTabsign',

    },

    regions: {
        complement: '.js-complement' // notamment pour stocker les <input>
    },

    templateContext() {
        return {
            showButtonHelp: this.getOption('tkzTab').inputsNumber > 0
        }
    },
    
    onClickTabvar(e:MouseEvent) {
        const target = e.currentTarget as HTMLElement
        const lineIndex = parseInt(target.getAttribute('data-lineindex'))
        const xIndex = parseInt(target.getAttribute('data-xindex'))
        const xpos = target.getAttribute('data-xpos')
        this.getOption('tkzTab').togglePosItem(lineIndex, xIndex, xpos)
        this.render()
    },

    onClickTabsign(e:MouseEvent) {
        const target = e.currentTarget as HTMLElement
        const lineIndex = parseInt(target.getAttribute('data-lineindex'))
        const xIndex = parseInt(target.getAttribute('data-xindex'))
        this.getOption('tkzTab').toggleSign(lineIndex, xIndex)
        this.render()
    },

    onRender():void {
        this.svgGroup = this.el.querySelector('.tkztab-content')
        const tkzTab = this.getOption('tkzTab')
        const svgConainer = this.el.querySelector('.tkztab-svg')
        svgConainer.setAttribute('viewBox', `0 0 ${tkzTab.width} ${tkzTab.height}`)
        const draw = SVG().addTo(this.svgGroup)
        tkzTab.render(draw, this.el.querySelector('.js-complement'))
        // On rend les textes en LaTeX
        renderTexInDomElement(this.el)
    },

    className():string {
        return this.getOption("result") === true
            ? 'list-group-item list-group-item-dark'
            : ''
    },
})

export default TkzTabView