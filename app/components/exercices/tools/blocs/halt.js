class Halt {
    static REGEX = /^<(halt|stop)\/?>$/;
    static parse(line) {
        const m = line.match(Halt.REGEX);
        if (m) {
            return new Halt();
        } else {
            return null;
        }
    }

    constructor() {
    }

    run(params, caller) {
        return null;
    }

    toString() {
        return `<HALT>`;
    }
}
    
export default Halt;