class Halt {
    static REGEX = /^<(halt|stop)\/?>$/;
    static parse(line:string):Halt|null {
        const m = line.match(Halt.REGEX);
        if (m) {
            return new Halt();
        } else {
            return null;
        }
    }

    constructor() {
    }

    run(params:Record<string, any>, caller:any):null {
        return null;
    }

    toString():string {
        return `<HALT>`;
    }
}

export default Halt;