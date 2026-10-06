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
        const [, tag, equationLogique] = m;
        if (tag === 'needed') {
            return new Needed(tag, equationLogique);
        }
        if (tag === 'until') {
            return new Until(tag, equationLogique);
        }
        if (tag === 'shuffle') {
            return new ShuffleBloc(tag);
        }
        return new IfBloc(tag, equationLogique);
    }

    static isElse(line:string):boolean {
        return /^<\s*else\s*>$/.test(line);
    }
}

export default FluxManager