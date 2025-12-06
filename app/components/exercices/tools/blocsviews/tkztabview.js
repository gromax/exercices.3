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
    
    onClickTabvar(e) {
        const target = e.currentTarget;
        const lineIndex = parseInt(target.getAttribute('data-lineindex'));
        const xIndex = parseInt(target.getAttribute('data-xindex'));
        const xpos = target.getAttribute('data-xpos');
        const ypos = target.getAttribute('data-ypos');
        const lines = this.getOption('lines');
        if (!Array.isArray(lines) || lines.length <= lineIndex || lines[lineIndex].type !== 'varform') {
            console.warn(`Invalid line index or type for var line button click: lineIndex=${lineIndex}`);
            return;
        }
        const line = lines[lineIndex];
        // il s'agit de remplacer le tag correspondant à l'item cliqué
        const itemTags = line.line.split(',').map( x => x.trim() );
        const itemTag = itemTags[xIndex].split('/')[0];
        const newYpos = (ypos === '+') ? '-' : '+';
        const newTag = xpos === ''
            ? newYpos
            : xpos === '+'
                ? itemTag.charAt(0) + itemTag.charAt(1) + newYpos
                : newYpos + itemTag.charAt(1) + itemTag.charAt(2);
        itemTags[xIndex] = newTag
        line.line = itemTags.join(',')
        this.render();
    },

    onRender() {
        this.svgGroup = this.el.querySelector('.tkztab-content');
        const config = this.getOption('config') || {};
        const tkzTab = new TkzTab(this.getOption('xlist'), config);
        for (let line of this.getOption('lines')) {
            if (line.type === 'sign') {
                tkzTab.addSignLine(line.line, line.tag, line.hauteur);
            } else if (line.type === 'var') {
                tkzTab.addVarLine(line.line, line.tag, line.hauteur);
            } else if (line.type === 'varform') {
                tkzTab.addVarLineForm(line.line, line.tag, line.hauteur);
            }
        }
        const svgConainer = this.el.querySelector('.tkztab-svg');
        svgConainer.setAttribute('viewBox', `0 0 ${tkzTab.width} ${tkzTab.height}`);
        const draw = SVG().addTo(this.svgGroup);
        tkzTab.render(draw);
        // On rend les textes en LaTeX
        renderTexInDomElement(this.el);
    }
});

export default TkzTabView;