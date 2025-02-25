import { EditorState, Plugin, Transaction } from "prosemirror-state";
import { Fragment, Slice } from "prosemirror-model";
import { DecorationSet, EditorView } from "prosemirror-view";
import { previewNodeView } from "./previewNodeView";
import { defaultOptions } from "./utils";
import { previewPluginKey, PreviewPluginState } from "./types";

export const previewPlugin = (
  callback: (url: string) => Promise<any>,
  apply: (
    tr: Transaction,
    value: PreviewPluginState,
    oldState: EditorState,
    newState: EditorState
  ) => PreviewPluginState,
  createDecorations: (state: EditorState) => DecorationSet,
  findPlaceholder: (state: EditorState, id: object) => number | null,
  options = defaultOptions
) =>
  new Plugin<PreviewPluginState>({
    key: previewPluginKey,
    state: {
      init() {
        return [];
      },
      apply,
    },
    props: {
      decorations: (state: EditorState) => {
        return createDecorations(state);
      },
      transformPasted: (slice: Slice, view: EditorView) => {
        if (!options.pasteLink) {
          return slice;
        }
        const id = {};
        const { tr } = view.state;
        const textContent = slice.content.firstChild?.textContent;
        let origin = null;
        try {
          origin = new URL(textContent || "").origin;
          if (!tr.selection.empty) {
            tr.deleteSelection();
          }
          tr.setMeta(previewPluginKey, {
            id,
            pos: tr.selection.from,
            type: "add",
          });
          view.dispatch(tr);
        } catch (e) {
          return slice;
        }

        if (textContent && origin) {
          callback(textContent).then(
            (data) => {
              const { title, description, images } = data;
              if (!images?.[0]) {
                const node = view.state.schema.text(textContent);
                view.dispatch(view.state.tr.replaceSelectionWith(node));
                return;
              }
              const attrs = {
                title,
                description,
                src: images[0],
                alt: title,
                url: textContent,
              };
              const previewNode = view.state.schema.nodes.preview.create(attrs);

              const pos = findPlaceholder(view.state, id);
              if (!pos) {
                return;
              }
              view.dispatch(
                view.state.tr
                  .replaceWith(pos, pos, previewNode)
                  .setMeta(previewPluginKey, { type: "remove", id })
              );
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
        preview: (node, view, getPos) => {
          return previewNodeView(node, view, getPos, options);
        },
      },
    },
  });
