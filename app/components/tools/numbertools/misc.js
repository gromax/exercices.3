/**
 * Renvoie le pgcd de a, b
 * @param {number} a 
 * @param {number} b 
 * @returns {number}
 */
function pgcd(a,b) {
    if ((a==0) && (b==0)) {
        throw new Error("0 % 0 n'est pas autorisé.");
    }
    a = Math.abs(a);
    b = Math.abs(b);
    while (b!=0) {
        let t = b;
        b = a % b;
        a = t;
    }
    return a;
}

export { pgcd }