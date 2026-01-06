import MyMath from "../mymath"

class Str {
    static NAME = 'Str';
    static METHODS = {
        'replace': Str.replace,
        'prefix': Str.prefix,
        'postfix': Str.postfix,
        'format': Str.format,
    }

    static replace(str, searchValue, replaceValue) {
        str = String(str)
        searchValue = String(searchValue)
        replaceValue = String(replaceValue)
        return str.replaceAll(searchValue, replaceValue)
    }

    static prefix(value, prefixStr) {
        if (Array.isArray(value)) {
            return value.map(v => Str.prefix(v, prefixStr));
        }
        return prefixStr + String(value);
    }

    static postfix(value, postfixStr) {
        if (Array.isArray(value)) {
            return value.map(v => Str.postfix(v, postfixStr));
        }
        return String(value) + postfixStr;
    }

    static format(value, format) {
        if (Array.isArray(value)) {
            return value.map(v => Str.format(v, format));
        }
        return MyMath.make(value).toFormat(format)
    }
}

export default Str