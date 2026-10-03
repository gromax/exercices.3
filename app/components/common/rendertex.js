import renderMathInElement from "katex/contrib/auto-render";

function renderTexInDomElement(domelement) {
    renderMathInElement(domelement, {
        delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false}
        ],
        throwOnError: false,
        errorCallback: (error) => {
            console.error('KaTeX error:', error);
        }
    });
}

export default renderTexInDomElement;