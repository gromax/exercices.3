import { Decimal } from 'decimal.js'
const ISYMBOL = "𝐢"

class ComplexDecimal {
    private _real: Decimal
    private _imag: Decimal

    get real(): Decimal {
        return this._real
    }

    get imag(): Decimal {
        return this._imag
    }

    static makeReal(real: Decimal | number | string): ComplexDecimal {
        return new ComplexDecimal(real, 0)
    }

    static NaN(): ComplexDecimal {
        return new ComplexDecimal(NaN, NaN)
    }

    constructor(real: Decimal | number | string, imag: Decimal | number | string) {
        this._real = new Decimal(real)
        this._imag = new Decimal(imag)
    }

    isNaN(): boolean {
        return this._real.isNaN() || this._imag.isNaN()
    }

    toString(): string {
        if (this._imag.isZero()) {
            return this._real.toString()
        }
        if (this._imag.isNegative()) {
            return `${this._real.toString()} - ${this._imag.negated().toString()}${ISYMBOL}`
        }
        return `${this._real.toString()} + ${this._imag.toString()}${ISYMBOL}`
    }

    mult(other: ComplexDecimal|Decimal): ComplexDecimal {
        if (other instanceof Decimal) {
            return new ComplexDecimal(this._real.mul(other), this._imag.mul(other))
        }
        const realPart = this._real.mul(other.real).sub(this._imag.mul(other.imag))
        const imagPart = this._real.mul(other.imag).add(this._imag.mul(other.real))
        return new ComplexDecimal(realPart, imagPart)
    }

    plus(other: ComplexDecimal|Decimal): ComplexDecimal {
        if (other instanceof Decimal) {
            return new ComplexDecimal(this._real.plus(other), this._imag)
        }
        const realPart = this._real.plus(other.real)
        const imagPart = this._imag.plus(other.imag)
        return new ComplexDecimal(realPart, imagPart)
    }

    minus(other: ComplexDecimal|Decimal): ComplexDecimal {
        if (other instanceof Decimal) {
            return new ComplexDecimal(this._real.minus(other), this._imag)
        }
        const realPart = this._real.minus(other.real)
        const imagPart = this._imag.minus(other.imag)
        return new ComplexDecimal(realPart, imagPart)
    }

    conjugate(): ComplexDecimal {
        return new ComplexDecimal(this._real, this._imag.negated())
    }

    abs2(): Decimal {
        return this._real.mul(this._real).add(this._imag.mul(this._imag))
    }
    
    abs(): Decimal {
        return this.abs2().sqrt()
    }

    arg(): Decimal {
        return Decimal.atan2(this._imag, this._real)
    }

    divideByReal(real: Decimal | number | string): ComplexDecimal {
        const realDecimal = new Decimal(real)
        return new ComplexDecimal(this._real.div(realDecimal), this._imag.div(realDecimal))
    }

    divide(other: ComplexDecimal|Decimal): ComplexDecimal {
        if (other instanceof Decimal) {
            return this.divideByReal(other)
        }
        const denominator = other.abs2()
        const numerator = this.mult(other.conjugate())
        return numerator.divideByReal(denominator)
    }

    inverse(): ComplexDecimal {
        const denominator = this.abs2()
        const conjugate = this.conjugate()
        return conjugate.divideByReal(denominator)
    }

    negated(): ComplexDecimal {
        return new ComplexDecimal(this._real.negated(), this._imag.negated())
    }

    isReal(): boolean {
        return this._imag.isZero()
    }

    isImaginary(): boolean {
        return this._real.isZero()
    }

    toFixed(n:number): string {
        if (this.isReal()) {
            return this._real.toFixed(n)
        }
        if (this.isImaginary()) {
            return `${this._imag.toFixed(n)}${ISYMBOL}`
        }
        const realPart = this._real.toFixed(n)
        const imagPart = this._imag.abs().toFixed(n)
        if (this._imag.isNegative()) {
            return `${realPart} - ${imagPart}${ISYMBOL}`
        }
        return `${realPart} + ${imagPart}${ISYMBOL}`
    }
}

export { ComplexDecimal }