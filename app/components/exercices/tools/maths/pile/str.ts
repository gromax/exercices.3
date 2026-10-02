import MyMath from "../mymath"
import type { NestedArray, InputType } from "@types"

class Str {
    static NAME = 'Str';
    static METHODS = {
        'replace': Str.replace,
        'prefix': Str.prefix,
        'postfix': Str.postfix,
        'format': Str.format,
        'addTexMarkup': Str.addTexMarkup,
        'addStrMarkup': Str.addStrMarkup
    }

    static replace(str:InputType, searchValue:InputType, replaceValue:InputType): string {
        str = MyMath.extractBrutText(str)
        searchValue = MyMath.extractBrutText(searchValue)
        replaceValue = MyMath.extractBrutText(replaceValue)
        return str.replaceAll(searchValue, replaceValue)
    }

    static prefix(value:NestedArray<InputType>, prefixStr:InputType):NestedArray<string> {
        if (Array.isArray(value)) {
            return value.map(v => Str.prefix(v, prefixStr));
        }
        return MyMath.extractBrutText(prefixStr) + String(value);
    }

    static postfix(value:NestedArray<InputType>, postfixStr:InputType):NestedArray<string> {
        if (Array.isArray(value)) {
            return value.map(v => Str.postfix(v, postfixStr));
        }
        return String(value) + MyMath.extractBrutText(postfixStr);
    }

    static format(value:NestedArray<InputType>, format:InputType):NestedArray<string> {
        if (Array.isArray(value)) {
            return value.map(v => Str.format(v, format));
        }
        return MyMath.toFormat(value, MyMath.extractBrutText(format))
    }

    static addTexMarkup(value:NestedArray<InputType>):NestedArray<string> {
        if (Array.isArray(value)) {
            return value.map(v => Str.addTexMarkup(v));
        }
        return `$${String(value)}$`;
    }

    static addStrMarkup(value:NestedArray<InputType>):NestedArray<string> {
        if (Array.isArray(value)) {
            return value.map(v => Str.addStrMarkup(v));
        }
        return `"${String(value)}"`;
    }
}

export default Str