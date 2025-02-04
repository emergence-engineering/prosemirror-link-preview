import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { IDefaultOptions } from "./types";

export const previewNodeView = (
  node: Node,
  view: EditorView,
  getPos: () => number | undefined,
  options: IDefaultOptions
) => {
  const container = document.createElement("div");
  container.className = "preview-root";
  const img = document.createElement("img");
  img.classList.add("preview-img");
  img.src = node.attrs.src;
  img.alt = node.attrs.alt;

  const title = document.createElement("div");
  title.classList.add("preview-title");
  title.textContent = node.attrs.title;

  const description = document.createElement("div");
  description.classList.add("preview-description");
  description.textContent = node.attrs.description;

  const url = document.createElement("a");
  url.href = node.attrs.url;
  url.textContent = node.attrs.url;
  url.classList.add("preview-url");

  container.appendChild(img);
  container.appendChild(title);
  container.appendChild(description);
  container.appendChild(url);
  container.addEventListener("click", () => {
    if (options.openLinkOnClick) {
      window.open(node.attrs.url, "_blank");
    }
  });
  container.style.cursor = options.openLinkOnClick ? "pointer" : "default";
  img.style.cursor = options.openLinkOnClick ? "pointer" : "default";

  const dom = container;

  return {
    dom,
    update: (node: Node) => {
      const img = dom.querySelector("img");
      const title = dom.querySelector(".preview-title");
      const description = dom.querySelector(".preview-description");

      if (!img || !title || !description) {
        return false;
      }

      img.src = node.attrs.src;
      img.alt = node.attrs.alt;
      description.textContent = node.attrs.description;
      title.textContent = node.attrs.title;

      return true;
    },

    selectNode: () => {
      const { state, dispatch } = view;
      const transaction = state.tr.setMeta("selectedNode", getPos());
      dispatch(transaction);
    },

    deselectNode: () => {
      const { state, dispatch } = view;
      const transaction = state.tr.setMeta("selectedNode", null);
      dispatch(transaction);
    },

    destroy: () => {
      dom.remove();
    },
  };
};
