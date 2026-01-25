import MyMath from "../mymath"
import type { NestedArray } from "@types"

type InputType = string | number | MyMath

class Str {
    static NAME = 'Str';
    static METHODS = {
        'replace': Str.replace,
        'prefix': Str.prefix,
        'postfix': Str.postfix,
        'format': Str.format,
    }

    static replace(str:InputType, searchValue:InputType, replaceValue:InputType): string {
        str = String(str)
        searchValue = String(searchValue)
        replaceValue = String(replaceValue)
        return str.replaceAll(searchValue, replaceValue)
    }

    static prefix(value:NestedArray<InputType>, prefixStr:string):NestedArray<string> {
        if (Array.isArray(value)) {
            return value.map(v => Str.prefix(v, prefixStr));
        }
        return prefixStr + String(value);
    }

    static postfix(value:NestedArray<InputType>, postfixStr:string):NestedArray<string> {
        if (Array.isArray(value)) {
            return value.map(v => Str.postfix(v, postfixStr));
        }
        return String(value) + postfixStr;
    }

    static format(value:NestedArray<InputType>, format:string):NestedArray<string> {
        if (Array.isArray(value)) {
            return value.map(v => Str.format(v, format));
        }
        return MyMath.make(value).toFormat(format)
    }
}

export default Str