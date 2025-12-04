import renderMathInElement from "katex/contrib/auto-render";

function renderTex(domelement) {
  renderMathInElement(domelement, {
    delimiters: [
      {left: "$", right: "$", display: false},
      {left: "$$", right: "$$", display: true}
    ],
    throwOnError: false
  });
}

export default renderTex;