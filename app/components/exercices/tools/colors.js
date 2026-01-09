class Colors {
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
        this._n = Colors.COLORS.length-1;
        this._indices = Array.from({length: this._n}, (_, i) => i+1);
        
        // Mélanger avec Fisher-Yates
        for (let i = this._n - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._indices[i], this._indices[j]] = [this._indices[j], this._indices[i]];
        }
    }

    _getI(index) {
        if (index === 0) {
            return 0;
        }
        return this._indices[(index - 1) % this._n];
    }

    getColor(index) {
        return Colors.COLORS[this._getI(index)];
    }

    getPicto(index) {
        return Colors.PICTOS[this._getI(index)];
    }
}

export default Colors;