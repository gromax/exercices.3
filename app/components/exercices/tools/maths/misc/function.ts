function gcd(a: number, b: number): number {
    a = Math.abs(a)
    b = Math.abs(b)
    if (!Number.isInteger(a) || !Number.isInteger(b)) {
        throw new Error(`[${String(a)} , ${String(b)}] Entiers requis pour le PGCD.`)
    }
    if (a==0 && b==0) {
        throw new Error(`PGCD(0;0) n'est pas défini.`)
    }
    while (b !== 0) {
        const r = a % b
        a = b
        b = r
    }
    return a
}

export { gcd }