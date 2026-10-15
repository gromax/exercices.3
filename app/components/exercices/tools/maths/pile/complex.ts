import type { InputType } from "@types"
import MyMath from '../mymath'
import { conjugaison, real, imaginaire, abs, arg } from '../misc/complexcalculus'
import { pifrac, approxFraction } from '../misc/functions'
import { Scalar } from '../number/scalar'
import { Mult } from '../number/mult'
import { PI } from '../number/constant'
import { Function } from '../number/function'

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
        const zm = MyMath.make(z).getMyNumber()
        return MyMath.make(real(zm))
    }

    static imag(z: InputType): MyMath {
        const zm = MyMath.make(z).getMyNumber()
        return MyMath.make(imaginaire(zm))
    }

    static conj(z: InputType): MyMath {
        const zm = MyMath.make(z).getMyNumber()
        return MyMath.make(conjugaison(zm))
    }
    
    static abs(z: InputType): MyMath {
        const zm = MyMath.make(z).getMyNumber().toComplexDecimal(undefined).abs()
        const res = approxFraction(zm)
        if (res!==false) {
            const s = new Scalar(res[0], res[1])
            const f = new Function('sqrt', s)
            return MyMath.make(f)
        }
        return MyMath.make(new Scalar(zm.sqrt()))
    }

    static arg(z: InputType): MyMath {
        const zm = MyMath.make(z).getMyNumber().toComplexDecimal(undefined).arg()
        const res = pifrac(zm)
        if (res!==false) {
            const s = new Scalar(res[0], res[1])
            return MyMath.make(Mult.mult(s, PI))
        }
        return MyMath.make(new Scalar(zm))
    }
}

export { Complex }