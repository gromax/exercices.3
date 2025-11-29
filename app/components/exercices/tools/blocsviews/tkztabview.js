import { View } from 'backbone.marionette';
import { SVG } from '@svgdotjs/svg.js';
import tkztabview_tpl from '@templates/exercices/bloc/tkztab.jst'
import TkzTab from './tkztab/tkztab';

const TkzTabView = View.extend({
    template: tkztabview_tpl,

    onRender() {
        this.svgGroup = this.el.querySelector('.tkztab-content');
        const config = this.getOption('config') || {};
        const tkzTab = new TkzTab(this.getOption('xlist'), config);
        for (let line of this.getOption('lines')) {
            if (line.type === 'sign') {
                tkzTab.addSignLine(line.line, line.tag, line.hauteur);
            } else if (line.type === 'var') {
                tkzTab.addVarLine(line.line, line.tag, line.hauteur);
            }
        }
        const svgConainer = this.el.querySelector('.tkztab-svg');
        svgConainer.setAttribute('viewBox', `0 0 ${tkzTab.width} ${tkzTab.height}`);
        const draw = SVG().addTo(this.svgGroup);
        tkzTab.render(draw);
    }
});

export default TkzTabView;