import * as katex from 'katex'
import { Svg, G, ForeignObject } from '@svgdotjs/svg.js'

type Options = {
    color?:string,
    fontSize?:string,
    useKaTeX?:boolean,
    alignItems?:string,
    justifyContent?:string,
    displayMode?:boolean
}

/**
 * Crée un foreignObject avec du contenu texte/LaTeX
 * @param {Svg|G} svg_parent Instance SVG.js
 * @param {number} x Position X
 * @param {number} y Position Y
 * @param {number} width Largeur
 * @param {number} height Hauteur
 * @param {string} content Contenu texte ou LaTeX
 * @param {object} options Options (color, fontSize, etc.)
 * @returns {ForeignObject}
 */
function createTextForeignObject(
    svg_parent:Svg|G,
    x:number,
    y:number,
    width:number,
    height:number,
    content:string,
    options:Options = {}
):ForeignObject {
    const fo = svg_parent.foreignObject(width, height).move(x, y)
    
    const wrapper:HTMLElement = document.createElement('div')
    wrapper.style.width = '100%'
    wrapper.style.height = '100%'
    wrapper.style.display = 'flex'
    wrapper.style.alignItems = options.alignItems || 'center'
    wrapper.style.justifyContent = options.justifyContent || 'center'
    wrapper.style.fontSize = options.fontSize || '20px'
    wrapper.style.color = options.color || this._config.color
    
    // Rendre avec KaTeX si nécessaire
    if (options.useKaTeX && (content.includes('\\') || content.includes('^') || content.includes('_'))) {
        try {
            katex.render(content, wrapper, {
                throwOnError: false,
                displayMode: options.displayMode || false
            })
        } catch (e) {
            wrapper.textContent = content
        }
    } else {
        wrapper.textContent = content
    }
    
    fo.node.appendChild(wrapper)
    return fo
}

export default createTextForeignObject