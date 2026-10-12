import Decimal from "decimal.js"

const PREMIERS = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101,
    103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229,
    233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353,
    359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479,
    487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617,
    619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757,
    761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907,
    911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997
]

/**
 * Renvoie un premier aléatoire <= n
 * @param {number} n 
 * @returns {number} un nombre premier aléatoire <= n
 */
function aleaPrime(n:number): number {
    if (n < 2) {
        throw new Error(`Aucun nombre premier inférieur ou égal à ${n}.`)
    }
    if (n >= 1009) {
        throw new Error(`La liste prédéfinie ne prévoit que les premiers <= 997. ${n} est donc trop grand.`)
    }
    const primes = PREMIERS.filter(p => p <= n)
    const i = Math.floor(Math.random() * primes.length)
    return primes[i]
    }

/** Calcul du plus grand commun diviseur de deux entiers a et b
 * Valable même pour a et b décimaux
 * @param {Decimal} a
 * @param {Decimal} b
 * @returns {Decimal}
 */
function gcd(a:Decimal, b:Decimal):Decimal {
    if (a.isNaN() || b.isNaN()) {
        return new Decimal("NaN")
    }
    if (b.isZero()) {
        if (a.isZero()) {
            return new Decimal("NaN")
        }
        return a
    }
    if (a.isZero()) {
        return b
    }
    a = a.abs()
    b = b.abs()
    let r = a.mod(b)
    while (!r.isZero()) {
        a = b
        b = r
        r = a.mod(b)
    }
    return new Decimal(b)
}

function ppcm(a: Decimal, b: Decimal): Decimal {
    if (a.isZero() && b.isZero()) return new Decimal("NaN")
    a = a.abs()
    b = b.abs()
    return a.times(b).dividedBy(gcd(a, b))
}

/**
 * Un décimal étant fourni, on cherche une fraction a/b approchée
 * @param {Decimal} x
 * @returns {[Decimal, Decimal]|false} une fraction approchée [a, b] telle que a/b ≈ x ou false en cas d'échec
 */
function approxFraction(x:Decimal): [Decimal, Decimal]|false {
    if (x.isNaN()) {
        return false
    }
    if (x.isInteger()) {
        return [x, new Decimal(1)]
    }
    const entier = x.floor()
    const fracPart = x.minus(entier)
    const strDecimalsFull = fracPart.toString().split('.')[1] || ''
    const nFull = strDecimalsFull.length
    if (nFull < 30) {
        const den = new Decimal("1"+"0".repeat(nFull))
        const num = new Decimal(strDecimalsFull)
        const PGCD = gcd(den, num)
        const den2 = den.div(PGCD)
        const num2 = num.div(PGCD)
        return [entier.mul(den2).plus(num2), den2]
    }
    const strDecimals = strDecimalsFull.slice(0,-5)
    const n = nFull-5

    // on part de la fin à la recherche d'une période
    // au max de 15 chiffres
    for (let periodSize = 1; periodSize<=10; periodSize++) {
        // Je veux au moins 30 chiffres qui se répètent
        const minRepeat = Math.ceil(30 / periodSize)
        const periodDigits = strDecimals.slice(-periodSize)
        if (!strDecimals.endsWith(periodDigits.repeat(minRepeat))) {
            continue
        }
        // maintenant, cherchons le début de la période
        let periodNumber:number
        for (periodNumber=minRepeat+1; periodNumber<n; periodNumber++) {
            if (periodNumber*periodSize > n) {
                break
            }
            if (!strDecimals.endsWith(periodDigits.repeat(periodNumber))) {
                break
            }
        }
        // à ce stade on a trouvé j. Il faut j-1
        periodNumber--
        const prePeriod = new Decimal(strDecimals.slice(0, -periodNumber*periodSize))
        const den = (new Decimal("1" + "0".repeat(n-periodSize*periodNumber))).minus(1)
        const PGCD = gcd(prePeriod, den)
        const prePeriod2 = prePeriod.div(PGCD)
        const den2 = den.div(PGCD)
        return [entier.mul(den2).plus(prePeriod2), den2]
    }
    return false
}

/**
 * tente de trouver x sous forme d'une fraction approchée de pi
 * @param {Decimal } x 
 * @returns {[Decimal, Decimal]|false} une fraction approchée [a, b] telle que a/b ≈ x ou false en cas d'échec
 */
function pifrac(x:Decimal): [Decimal, Decimal]|false {
    const y = x.div(Decimal.acos(-1))
    return approxFraction(y)
}

export { gcd, aleaPrime, ppcm, approxFraction, pifrac }