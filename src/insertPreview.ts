import { EditorView } from "prosemirror-view";
import { previewPluginKey } from "./types";

export const insertPreview = (
  view: EditorView,
  url: string,
  pos: number,
  id: object,
  callback: (url: string) => Promise<any>
) => {
  if (!id) {
    return;
  }

  callback(url).then((data) => {
    const { title, description, images } = data;
    if (!images?.[0]) {
      const node = view.state.schema.text(url);
      view.dispatch(view.state.tr.replaceSelectionWith(node));
      return;
    }
    const attrs = {
      title,
      description,
      src: images[0],
      alt: title,
      url,
    };
    const previewNode = view.state.schema.nodes.preview.create(attrs);

    if (!pos) {
      return;
    }
    view.dispatch(
      view.state.tr
        .replaceWith(pos, pos + url.length, previewNode)
        .setMeta(previewPluginKey, { type: "remove", id })
    );
  });
};
