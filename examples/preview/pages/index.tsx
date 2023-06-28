import * as Y from "yjs";
import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { useEffect, useMemo, useState } from "react";
import {
  absolutePositionToRelativePosition,
  relativePositionToAbsolutePosition,
  ySyncPlugin,
  ySyncPluginKey,
  yUndoPlugin,
} from "y-prosemirror";
import { HocuspocusProvider } from "@hocuspocus/provider";
import {
  addPreviewNode,
  apply,
  applyYjs,
  createDecorations,
  createDecorationsYjs,
  findPlaceholder,
  findPlaceholderYjs,
  previewPlugin,
} from "prosemirror-link-preview";

const mySchema = new Schema({
  nodes: addPreviewNode(schema.spec.nodes),
  marks: schema.spec.marks,
});

const plugKey = new PluginKey("plugKey");
const plug = () => {
  return new Plugin<{ deco: { from: any; to: any }[] }>({
    key: plugKey,
    state: {
      init() {
        return {
          deco: [],
        };
      },
      apply(tr, pluginState, oldState, newState) {
        const YState = ySyncPluginKey.getState(newState);
        console.log({ YState, size: oldState.doc.content.size });
        if (pluginState.deco.length === 0 && oldState.doc.content.size > 10) {
          const from = absolutePositionToRelativePosition(
            5,
            YState.type,
            YState.binding.mapping
          );

          const to = absolutePositionToRelativePosition(
            8,
            YState.type,
            YState.binding.mapping
          );

          console.log({ from, to });

          return {
            deco: [{ from, to }],
          };
        }
        return pluginState;
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = plugKey.getState(state);
        if (!pluginState) return null;
        const YState = ySyncPluginKey.getState(state);
        const deco = pluginState.deco
          .map((deco: { from: any; to: any }) => {
            const from = relativePositionToAbsolutePosition(
              YState.doc,
              YState.type,
              deco.from,
              YState.binding.mapping
            );
            const to = relativePositionToAbsolutePosition(
              YState.doc,
              YState.type,
              deco.to,
              YState.binding.mapping
            );
            console.log(YState.doc.toJSON());
            return !from || !to
              ? undefined
              : Decoration.inline(from, to, { class: "plug" });
          })
          .filter(Boolean) as Decoration[];
        console.log({ deco });
        return DecorationSet.create(state.doc, deco);
      },
    },
  });
};
const plug2Key = new PluginKey("plug2Key");

const plug2 = (fragment: Y.XmlFragment) => {
  let init = false;
  return new Plugin({
    key: plug2Key,
    state: {
      init() {
        return {};
      },
      apply(tr, pluginState) {
        console.log("apply plug2");
        const plug2Meta = tr.getMeta(plug2Key);
        return plug2Meta || pluginState;
      },
    },
    view: (view) => ({
      update: (view, prevState) => {
        if (!init) {
          init = true;
          fragment.observeDeep((events) => {
            if (
              // Valami jobb ide pls, mittomen doc!== doc
              JSON.stringify(view.state.doc.toJSON()) !==
              JSON.stringify(prevState.doc.toJSON())
            ) {
              view.dispatch(view.state.tr.setMeta(plug2Key, {}));
            }
          });
        }
      },
    }),
    // props: {
    //   decorations: (state) => {
    //     const pluginState = plugKey.getState(state);
    //     if (!pluginState) return null;
    //     const YState = ySyncPluginKey.getState(state);
    //     const deco = pluginState.deco
    //       .map((deco: { from: any; to: any }) => {
    //         const from = relativePositionToAbsolutePosition(
    //           YState.doc,
    //           YState.type,
    //           deco.from,
    //           YState.binding.mapping
    //         );
    //         const to = relativePositionToAbsolutePosition(
    //           YState.doc,
    //           YState.type,
    //           deco.to,
    //           YState.binding.mapping
    //         );
    //         console.log(YState.doc.toJSON());
    //         return !from || !to
    //           ? undefined
    //           : Decoration.inline(from, to, { class: "plug" });
    //       })
    //       .filter(Boolean) as Decoration[];
    //     console.log({ deco });
    //     return DecorationSet.create(state.doc, deco);
    //   },
    // },
  });
};

const ydoc = new Y.Doc();

export default function Home() {
  const [view, setView] = useState<EditorView | null>(null);

  const provider = useMemo(() => {
    return new HocuspocusProvider({
      url: "ws://127.0.0.1:8080",
      name: "default",
      document: ydoc,
      token: "prosemirror-link-preview",
    });
  }, []);

  useEffect(() => {
    provider.connect();
    return () => {
      provider.disconnect();
    };
  }, [provider]);

  useEffect(() => {
    const yXmlFragment = ydoc.getXmlFragment("prosemirror");
    yXmlFragment.observeDeep((event) => {
      console.log("ychanges", event);
    });

    const v = new EditorView(document.querySelector("#editor") as HTMLElement, {
      state: EditorState.create({
        // doc: mySchema.nodeFromJSON(initialDoc),
        doc: DOMParser.fromSchema(mySchema).parse(
          document.createElement("div")
        ),
        plugins: [
          ySyncPlugin(yXmlFragment),
          ...exampleSetup({ schema: mySchema }),
          // yCursorPlugin(provider.awareness),
          yUndoPlugin(),
          plug(),
          plug2(yXmlFragment),
          /* grammarSuggestPlugin("-qKivjCv6MfQSmgF438PjEY7RnLfqoVe", {
           *   ...defaultOptions,
           *   withYjs: true,
           * }), */
        ],
      }),
      dispatchTransaction: (tr) => {
        console.log({ tr });
        v.updateState(v.state.apply(tr));
        /* if (newState) {
         *   setView(newState);
         * } */
      },
    });
    setView(v);

    return () => {
      v.destroy();
    };
  }, []);

  return (
    <div>
      <div id="editor" />
    </div>
  );
}
