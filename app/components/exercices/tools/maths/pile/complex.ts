import type { InputType } from "@types"
import MyMath from '../mymath'
import { conjugaison } from '../misc/complexcalculus'
import { pifrac } from '../misc/functions'
import { Scalar } from '../number/scalar'
import { Mult } from '../number/mult'
import { PI } from '../number/constant'
import Decimal from "decimal.js"

import nerdamer from 'nerdamer'
import 'nerdamer/all'
import { ComplexDecimal } from '../misc/complexdecimal'

class Complex {
    static readonly NAME = 'Complex'
    static readonly METHODS = {
        'real': Complex.real,
        'imag': Complex.imag,
        'conj': Complex.conj,
        'abs': Complex.abs,
        'arg': Complex.arg,
    };

    static real(z: InputType): MyMath {
        const zStr = MyMath.normalization(z.toString())
        // bug nerdamer ! il faut expand
        const nerd = nerdamer(`realpart(expand(${zStr}))`)
        const str = MyMath.denormalization(nerd.toString())
        return MyMath.make(str)
    }

    static imag(z: InputType): MyMath {
        const zStr = MyMath.normalization(z.toString())
        // bug nerdamer ! il faut expand
        const nerd = nerdamer(`imagpart(expand(${zStr}))`)
        const str = MyMath.denormalization(nerd.toString())
        return MyMath.make(str)
    }

    static conj(z: InputType): MyMath {
        const zm = MyMath.make(z).getMyNumber()
        return MyMath.make(conjugaison(zm))
    }
    
    static abs(z: InputType): MyMath {
        const real = Complex.real(z)
        const imag = Complex.imag(z)
        const nerd = nerdamer(`sqrt((${real})^2 + (${imag})^2)`)
        const str = MyMath.denormalization(nerd.toString())
        return MyMath.make(str)
    }

    static arg(z: InputType): MyMath {
        const real = Complex.real(z)
        const imag = Complex.imag(z)
        const cd = new ComplexDecimal(real.toDecimal(), imag.toDecimal())
        const angle = cd.arg()
        // tentative de reconnaître une fraction simple
        const res = pifrac(angle)
        if (res!==false) {
            const s = new Scalar(res[0], res[1])
            return MyMath.make(Mult.mult(s, PI))
        }
        // sinon c'est un nombre qui ne tombe pas juste
        const realStr = MyMath.denormalization(real.toString())
        const imagStr = MyMath.denormalization(imag.toString())
        if (cd.real.gte(0)) {
            if (cd.imag.gte(0)) {
                return MyMath.make(`atan((${imagStr})/(${realStr}))`).simplify()
            } else {
                return MyMath.make(`-atan((-(${imagStr}))/(${realStr}))`).simplify()
            }

        }
        if (cd.imag.gte(0)) {
            return MyMath.make(`-atan((${imagStr})/(-(${realStr}))) + pi`).simplify()
        }
        return MyMath.make(`atan((${imagStr})/(${realStr})) - pi`).simplify()
    }
}

export { Complex }