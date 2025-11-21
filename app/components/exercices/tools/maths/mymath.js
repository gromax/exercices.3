import MyNerd from './mynerd.js';
import tryAsPile from './pile/pile.js';



function evaluate(expression, params) {
    const pileResult = tryAsPile(expression, params);
    if (pileResult !== null) {
        return pileResult;
    }
    return MyNerd.make(expression, params).toString();
}





const MyMath = {
    evaluate,
};

export default MyMath