import MyMath from "../mymath"

class Tkztab {
    static NAME = 'Tkztab';
    static METHODS = {
        'sign': Tkztab.sign,
    }


    /**
     * renvoie la ligne de signes correspondant à l'expression et bornes
     * @param {MyMath} expr 
     * @param {Array} bornes 
     * @returns {String} ligne de signes
     */
    static sign(expr, bornes) {
        const f = MyMath.make(expr)
        if (bornes.length < 2) {
            throw new Error("Tkztab.sign nécessite au moins deux bornes.")
        }
        bornes = bornes.map(b => (typeof b === 'number' ? b : MyMath.make(b).toFloat())).sort((a, b) => a - b)
        const variables = f.variables
        const n = bornes.length
        if (variables.length == 0) {
            // c'st une constante
            const value = f.toFloat()
            const schar = value > 0 ? '+' : (value < 0 ? '-' : '0')
            const ssep = value === 0 ? 'z' : 't'
            const line = Array.from({ length: 2*n-1 }, (_, i) => i%2==0 ? ssep : schar)
            for (let i = 0; i < n; i++) {
                if (Math.abs(bornes[i]) === Infinity) {
                    line[2*i] = ''
                }
            }
            return line.join(',')
        }
        if (variables.length > 1) {
            throw new Error("Tkztab.sign ne gère que les fonctions d'une seule variable.")
        }
        const varName = variables[0]
        const values = bornes.map(b => {
            try {
                return f.sub(varName, b).toFloat()
            } catch (e) {
                return NaN
            }
        })
        const line = Array.from({ length: 2*n-1 }, (_, i) => i%2==0 ? 't' : '+')
        for (let i = 0; i < n; i++) {
            if (Math.abs(bornes[i]) === Infinity) {
                line[2*i] = ''
            } else if (values[i] == 0) {
                line[2*i] = 'z'
            } else if (isNaN(values[i])) {
                line[2*i] = 'd'
            }
        }
        // cas particulier de -Infinity, +Infinity
        if (bornes.length == 2 && bornes[0] === -Infinity && bornes[1] === Infinity) {
            // On peut calculer le signe en 0
            const value0 = f.sub(varName, 0).toFloat()
            line[1] = value0 > 0 ? '+' : (value0 < 0 ? '-' : '0')
            return line.join(',')
        }
        // sinon si on -infini à gauche on fait comme si c'était le suivant -10
        if (bornes[0] === -Infinity) {
            bornes[0] = bornes[1] - 10
        }
        // idem pour +infini
        if (bornes[n-1] === Infinity) {
            bornes[n-1] = bornes[n-2] + 10
        }
        // mainteant on peut utiliser les centres de chaque intervalle
        for (let i = 0; i < n-1; i++) {
            const mid = (bornes[i] + bornes[i+1]) / 2
            const valueMid = f.sub(varName, mid).toFloat()
            line[2*i + 1] = valueMid > 0 ? '+' : (valueMid < 0 ? '-' : '0')
        }
        return line.join(',')
    }
}

export default Tkztab