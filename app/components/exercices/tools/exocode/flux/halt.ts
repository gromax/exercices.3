import { SimpleNode } from "../node"

class Halt extends SimpleNode{
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

    runSimple(params:any):"halt" {
        return "halt"
    }

    toString():string {
        return `<HALT>`
    }
}

export default Halt