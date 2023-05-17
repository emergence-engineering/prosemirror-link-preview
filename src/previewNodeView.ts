import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";

export const previewNodeView = (
  node: Node,
  view: EditorView,
  getPos: () => number | undefined
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

  container.appendChild(img);
  container.appendChild(title);
  container.appendChild(description);

  const dom = container;

  return {
    dom,
    update: (node: Node) => {
      if (node.type !== node.type) {
        return false;
      }
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
