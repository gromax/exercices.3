import _ from 'underscore'
import MyMath from '../mymath'

type InputType = string | number | MyMath

class Alea {
    static readonly NAME = 'Alea'
    static readonly METHODS = {
        'entier': Alea.entier,
        'signe': Alea.signe,
        'lagrangePolynome': Alea.lagrangePolynome,
        'choice': Alea.choice
    };

    static entier(min:InputType, max:InputType):number {
        const a = MyMath.toNumber(min);
        const b = MyMath.toNumber(max);
        const _min = Math.min(a, b);
        const _max = Math.max(a, b);
        return Math.floor(Math.random() * (_max - _min + 1)) + _min;
    }

    static signe():number {
        return Math.random() < 0.5 ? -1 : 1;
    }

    static choice<T>(tab:Array<T>):T {
        if (!Array.isArray(tab) || tab.length === 0) {
            throw new Error("Paramètre invalide pour Alea.choice");
        }
        const index = Alea.entier(0, tab.length - 1);
        return tab[index];
    }

    static lagrangePolynome(
        xmin:InputType,
        ymin:InputType,
        xmax:InputType,
        ymax:InputType,
        n:InputType
    ):string {
        const _xmin = MyMath.toNumber(xmin);
        const _ymin = MyMath.toNumber(ymin);
        const _xmax = MyMath.toNumber(xmax);
        const _ymax = MyMath.toNumber(ymax);
        const _n = MyMath.toNumber(n);
        if (isNaN(_xmin) || isNaN(_ymin) || isNaN(_xmax) || isNaN(_ymax) || isNaN(_n) || _n < 0) {
            throw new Error("Paramètres invalides pour Alea.lagrangePolynome");
        }
        const xvalues = [];
        while (xvalues.length < _n+1) {
            const x = Math.floor(Math.random()*(_xmax-_xmin+1)) + _xmin;
            if (!xvalues.includes(x)) {
                xvalues.push(x);
            }
        }
        const yvalues:Array<number> = [];
        for (let i=0; i<_n+1; i++) {
            const y = Math.floor(Math.random()*(_ymax-_ymin+1))+_ymin;
            yvalues.push(y);
        }
        let expression = "0";
        for (let i=0; i<=_n; i++) {
            // on exprime un produit de (x - xj), j != i
            const monomes = _.reduce(xvalues, (acc, xj, j) => {
                if (j != i) {
                    return acc + `*(x-(${xj}))`;
                } else {
                    return acc;
                }
            }, '1');
            const poids = yvalues[i] / _.reduce(xvalues, (acc, xj, j) => {
                if (j != i) {
                    return acc * (xvalues[i] - xj);
                } else {
                    return acc;
                }
            }, 1);
            expression += ` + (${poids})*${monomes}`;
        }
        return MyMath.make(expression).expand().toString()
    }
}

export default Alea;