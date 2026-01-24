import _ from 'underscore'

class Colors {
    // nomnbre de couleurs disponibles (sans le noir)
    private _n:number
    // indices de 1 à n mélangés
    private _indices:Array<number>
    
    static COLORS = [
        'black',
        'blue',
        'red',
        'green',
        'orange',
        'purple',
        'sienna',
        'olive',
    ];

    static PICTOS = [
        'square',
        'circle',
        'hexagon',
        'diamond',
        'star',
        'pentagon',
        'heart',
        'cloud',
    ]

    constructor() {
        // produit un mélange des indices
        this._n = Colors.COLORS.length-1
        this._indices = Array.from({length: this._n}, (_, i) => i+1)
        
        // Mélanger avec Fisher-Yates
        for (let i = this._n - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._indices[i], this._indices[j]] = [this._indices[j], this._indices[i]]
        }
    }

    /**
     * renvoie le numéro associé à l'indice donné
     * @param index 
     * @returns {number} un indice entre 0 et n-1 correspondant à la couleur/picto à utiliser
     */
    private getI(index:number):number {
        if (index === 0) {
            return 0
        }
        return this._indices[(index - 1) % this._n]
    }

    getColor(index:number): string {
        return Colors.COLORS[this.getI(index)]
    }

    getPicto(index:number): string {
        return Colors.PICTOS[this.getI(index)]
    }
}

export default Colors