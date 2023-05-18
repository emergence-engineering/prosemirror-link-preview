import { Schema } from "prosemirror-model";

export const addPreviewNode = (
  nodes: Schema["spec"]["nodes"]
): typeof nodes => {
  return nodes.addToEnd("preview", {
    inline: true,
    group: "inline",
    atom: false,
    attrs: {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      description: { default: null },
    },
    parseDOM: [
      {
        tag: "div.preview-root",
        getAttrs(dom) {
          if (!(dom instanceof HTMLElement)) {
            return {};
          }
          return {
            src: dom.querySelector(".preview-img")?.getAttribute("src"),
            alt: dom.querySelector(".preview-img")?.getAttribute("alt"),
            title: dom.querySelector(".preview-title")?.textContent,
            description: dom.querySelector(".preview-description")?.textContent,
          };
        },
      },
    ],
    toDOM(node) {
      return [
        "div",
        { class: "preview-root" },
        [
          "img",
          { class: "preview-img", src: node.attrs.src, alt: node.attrs.alt },
        ],
        ["div", { class: "preview-title" }, node.attrs.title],
        ["div", { class: "preview-description" }, node.attrs.description],
      ];
    },
  });
};
