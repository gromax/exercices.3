import MyMath from "../mymath"

class Tkztab {
    static NAME = 'Tkztab';
    static METHODS = {
        'sign': Tkztab.sign,
        'ensemble': Tkztab.ensemble
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

    /**
     * Renvoie une chaîne représentant un ensemble solution
     * Pour une équation type expr > 0 ou exp >= 0...
     * @param {MyMath} expr 
     * @param {Array} bornes 
     * @param {string} asked signe, 'p' (positif), 'n' (négatif), 'p0' (pos ou nul), 'n0' (neg ou nul)
     */
    static ensemble(expr, bornes, asked) {
        if (!['p', 'n', 'p0', 'n0'].includes(asked)) {
            throw new Error(`Tkztab.ensemble asked parameter invalide: asked=${asked}`)
        }
        const s = Tkztab.sign(expr, bornes).split(',')
        const strBornes = bornes.map(b => String(b))
        const inters = []
        const pos = (asked === 'p' || asked === 'p0')
        const nul = (asked === 'p0' || asked === 'n0')
        // on prend les bornes des positifs
        for (let i = 0; i < s.length; i++) {
            if (i % 2 === 0) {
                // c'est une borne
                if (s[i] === 'z' && nul) {
                    inters.push(['[', strBornes[i/2], strBornes[i/2], ']'])
                }
            } else {
                // c'est une zone
                if ((s[i] === '+')&& pos || (s[i] === '-')&& !pos) {
                    inters.push([']', strBornes[(i-1)/2], strBornes[(i+1)/2], '['])
                }
            }
        }
        // on recolle les intervalles
        const resInters = []
        for (let inter of inters) {
            if (resInters.length === 0) {
                resInters.push(inter)
                continue
            }
            const lastInter = resInters[resInters.length - 1]
            if (lastInter[2] === inter[1] && (lastInter[3] === ']' || inter[0] === '[')) {
                // on peut recoller
                lastInter[2] = inter[2]
                lastInter[3] = inter[3]
            } else {
                resInters.push(inter)
            }
        }
        // on forme le résultat final
        const resIntersStr = resInters.map(inter => inter[0]+inter[1]+';'+inter[2]+inter[3])
        return resIntersStr.join('union')
    }
}

export default Tkztab