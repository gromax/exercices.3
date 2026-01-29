import IfBloc from "./ifbloc"
import Needed from "./needed"
import Until from "./until"
import Halt from "./halt"

class FluxManager {
    static tryParse(line:string):IfBloc|Needed|Until|Halt|null {
        const tryHalt = Halt.parse(line)
        if (tryHalt !== null) {
            return tryHalt
        }

        const regex = /^<(if|elif|needed|until)(\s+.*)?>$/;
        const m = line.match(regex);
        if (!m) {
            return null;
        }
        const [, tag, paramsString] = m;
        if (tag === 'needed') {
            return new Needed(tag, paramsString);
        }
        if (tag === 'until') {
            return new Until(tag, paramsString);
        }
        return new IfBloc(tag, paramsString);
    }

    static isElse(line:string):boolean {
        return /^<\s*else\s*>$/.test(line);
    }

    static isNeeded(item:any):boolean {
        return (item !== null && item instanceof Needed);
    }

    static isUntil(item:any):boolean {
        return (item !== null && item instanceof Until);
    }

}

export default FluxManager