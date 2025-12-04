import renderMathInElement from "katex/contrib/auto-render";

function renderTexInDomElement(domelement) {
  renderMathInElement(domelement, {
    delimiters: [
      {left: "$", right: "$", display: false},
      {left: "$$", right: "$$", display: true}
    ],
    throwOnError: false
  });
}

export default renderTexInDomElement;