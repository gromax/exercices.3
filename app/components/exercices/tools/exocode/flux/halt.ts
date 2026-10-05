import { FluxNode } from "../node"

class Halt extends FluxNode {
    static readonly REGEX = /^<(halt|stop)\/?>$/
    static parse(line:string):Halt|null {
        const m = line.match(Halt.REGEX)
        if (m) {
            return new Halt()
        } else {
            return null
        }
    }

    constructor() {
        super("halt")
    }

    goOn(params:any):boolean {
        return false
    }

    toString():string {
        return `<HALT>`
    }
}

export default Halt