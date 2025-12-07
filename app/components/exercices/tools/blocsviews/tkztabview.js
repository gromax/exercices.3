import { View } from 'backbone.marionette';
import { SVG } from '@svgdotjs/svg.js';
import tkztabview_tpl from '@templates/exercices/bloc/tkztab.jst'
import TkzTab from './tkztab/tkztab';
import renderTexInDomElement from '../../../common/rendertex';

const TkzTabView = View.extend({
    template: tkztabview_tpl,
    events: {
        'click .js-varline-button': 'onClickTabvar'
    },

    regions: {
        complement: '.js-complement' // notamment pour stocker les <input>
    },
    
    onClickTabvar(e) {
        const target = e.currentTarget
        const lineIndex = parseInt(target.getAttribute('data-lineindex'))
        const xIndex = parseInt(target.getAttribute('data-xindex'))
        const xpos = target.getAttribute('data-xpos')
        const ypos = target.getAttribute('data-ypos')
        const lines = this.getOption('lines')
        if (!Array.isArray(lines) || lines.length <= lineIndex || lines[lineIndex].type !== 'inputvar') {
            console.warn(`Invalid line index or type for var line button click: lineIndex=${lineIndex}`)
            return
        }
        const line = lines[lineIndex];
        // il s'agit de remplacer le tag correspondant à l'item cliqué
        const itemTags = line.line.split(',').map( x => x.trim() )
        const itemTagComponents = itemTags[xIndex].split('/')
        const itemTag = itemTagComponents[0]
        const newYpos = (ypos === '+') ? '-' : '+'
        const newTag = xpos === ''
            ? newYpos
            : xpos === '+'
                ? itemTag.charAt(0) + itemTag.charAt(1) + newYpos
                : newYpos + itemTag.charAt(1) + itemTag.charAt(2)
        
        itemTagComponents[0] = newTag
        const newFullTag = itemTagComponents.join('/')
        itemTags[xIndex] = newFullTag
        line.line = itemTags.join(',')
        this.render()
    },

    onRender() {
        this.svgGroup = this.el.querySelector('.tkztab-content');
        const config = this.getOption('config') || {};
        const tkzTab = new TkzTab(this.getOption('xlist'), config);
        tkzTab.addLines(this.getOption('lines'));
        const svgConainer = this.el.querySelector('.tkztab-svg');
        svgConainer.setAttribute('viewBox', `0 0 ${tkzTab.width} ${tkzTab.height}`);
        const draw = SVG().addTo(this.svgGroup);
        tkzTab.render(draw, this.el.querySelector('.js-complement'));
        // On rend les textes en LaTeX
        renderTexInDomElement(this.el);
    }
});

export default TkzTabView;