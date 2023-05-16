import { EditorState, Plugin, PluginKey, Transaction } from "prosemirror-state";
import { Fragment, Node, Slice, Schema } from "prosemirror-model";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { previewNodeView } from "./previewNodeView";
import {
  absolutePositionToRelativePosition,
  relativePositionToAbsolutePosition,
  ySyncPluginKey,
} from "y-prosemirror";

export const previewPluginKey = new PluginKey("previewPlugin");

type PreviewPluginState = {
  pos: number;
  id: {};
}[];

export const previewPlugin = (
  schema: Schema,
  callback: (url: string) => Promise<any>
) =>
  new Plugin<PreviewPluginState>({
    key: previewPluginKey,
    state: {
      init() {
        return [];
      },
      apply(tr, value, oldState, newState) {
        const action = tr.getMeta(previewPluginKey);
        if (action && action.type === "add") {
          const YState = ySyncPluginKey.getState(newState);
          const relPos = absolutePositionToRelativePosition(
            action.pos,
            YState.type,
            YState.binding.mapping
          );
          return [...value, { id: action.id as object, pos: relPos }];
        } else if (action && action.type === "remove") {
          return value.filter((i) => i.id !== action.id);
        }
        return value;
      },
    },
    props: {
      decorations: (state: EditorState) => {
        return createDecorations(state);
      },
      transformPasted: (slice: Slice, view: EditorView) => {
        let id = {};

        // Replace the selection with a placeholder
        let tr = view.state.tr;
        if (!tr.selection.empty) tr.deleteSelection();
        tr.setMeta(previewPluginKey, {
          id,
          pos: tr.selection.from,
          type: "add",
        });
        view.dispatch(tr);

        const textContent = slice.content.firstChild?.textContent;
        let origin = null;
        try {
          origin = new URL(textContent || "").origin;
        } catch (e) {
          return slice;
        }
        if (textContent && origin) {
          callback(textContent).then(
            (data) => {
              const { title, description, images } = data;
              const attrs = {
                title,
                description,
                src: images[0],
                url: textContent,
              };
              const previewNode = schema.nodes.preview.create(attrs);

              let pos = findPlaceholder(view.state, id);
              // If the content around the placeholder has been deleted, drop
              // the image
              if (pos == null) return;
              // Otherwise, insert it at the placeholder's position, and remove
              // the placeholder
              setTimeout(() => {
                view.dispatch(
                  view.state.tr
                    .replaceWith(pos, pos, previewNode)
                    .setMeta(previewPluginKey, { type: "remove", id })
                );
              }, 5000);
            },
            () => {
              // On failure, just clean up the placeholder
              view.dispatch(
                tr.setMeta(previewPluginKey, { type: "remove", id })
              );
            }
          );

          const emptyFragment = Fragment.empty;
          const emptySlice = new Slice(emptyFragment, 0, 0);
          return emptySlice;
        }
        return slice;
      },
      nodeViews: {
        preview: previewNodeView,
      },
    },
  });

const findPlaceholder = (state: EditorState, id: any) => {
  let decos = previewPluginKey.getState(state);
  let found = decos.find(undefined, undefined, (spec: any) => spec.id == id);
  return found.length ? found[0].from : null;
};

const createDecorations = (state: EditorState) => {
  const updatedState: Array<{ id: object; pos: any }> =
    previewPluginKey.getState(state);
  const YState = previewPluginKey.getState(state);
  const decors = updatedState.map((i) => {
    const pos = relativePositionToAbsolutePosition(
      YState.doc,
      YState.type,
      i.pos,
      YState.binding.mapping
    );
    const widget = document.createElement("placeholder");
    const deco =
      typeof pos === "number"
        ? Decoration.widget(pos, widget, {
            id: i.id,
          })
        : undefined;
    return deco;
  });
  return (
    DecorationSet.create(state.doc, decors.filter((i) => i) as Decoration[]) ||
    DecorationSet.empty
  );
};
