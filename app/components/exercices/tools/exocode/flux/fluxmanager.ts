import IfBloc from "./ifbloc"
import Needed from "./needed"
import Until from "./until"
import Halt from "./halt"
import { ShuffleBloc } from "./shuffleBloc"

class FluxManager {
    static tryParse(line:string):IfBloc|Needed|Until|Halt|ShuffleBloc|null {
        const tryHalt = Halt.parse(line)
        if (tryHalt !== null) {
            return tryHalt
        }

        const regex = /^<(if|elif|needed|until|shuffle)(\s+.*)?>$/;
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
        if (tag === 'shuffle') {
            return new ShuffleBloc(tag, paramsString);
        }
        return new IfBloc(tag, paramsString);
    }

    static isElse(line:string):boolean {
        return /^<\s*else\s*>$/.test(line);
    }

    static isNeeded(item:any):boolean {
        return (item !== null && item instanceof Needed);
    }
}

export default FluxManager