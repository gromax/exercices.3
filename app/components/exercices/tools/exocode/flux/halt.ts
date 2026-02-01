import { Node, TRunResult } from "../node"

class Halt extends Node{
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

    run(params:any):TRunResult {
        return "halt"
    }

    toString():string {
        return `<HALT>`
    }
}

export default Halt