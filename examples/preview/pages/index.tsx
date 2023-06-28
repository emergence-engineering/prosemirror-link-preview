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
import {
  defaultOptions,
  grammarSuggestPlugin,
} from "prosemirror-suggestcat-plugin";

const mySchema = new Schema({
  nodes: addPreviewNode(schema.spec.nodes),
  marks: schema.spec.marks,
});

const plugKey = new PluginKey("plugKey");
const plug = () => {
  return new Plugin({
    key: plugKey,
    state: {
      init() {
        return {
          decorations: [],
        };
      },
      apply(tr, pluginState, oldState, newState) {
        const YState = ySyncPluginKey.getState(newState);
        console.log({ YState, size: oldState.doc.content.size });
        if (
          pluginState.decorations.length === 0 &&
          oldState.doc.content.size > 30
        ) {
          const from = absolutePositionToRelativePosition(
            tr.mapping.map(10),
            YState.type,
            YState.binding.mapping
          );

          const to = absolutePositionToRelativePosition(
            tr.mapping.map(15),
            YState.type,
            YState.binding.mapping
          );

          console.log({ from, to });

          return {
            decorations: [{ from, to }],
          };
        }
        return {
          decorations: pluginState.decorations,
        };
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = plugKey.getState(state);
        console.log({ pluginState });
        if (!pluginState) return null;
        const YState = ySyncPluginKey.getState(state);
        const deco = pluginState.decorations
          .map((deco: { from: any; to: any }) => {
            console.log("this", deco.from, deco.to);
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

export default function Home() {
  const [view, setView] = useState<EditorView | null>(null);
  const ydoc = new Y.Doc();

  const provider = useMemo(() => {
    return new HocuspocusProvider({
      url: "ws://127.0.0.1:8080",
      name: "default",
      document: ydoc,
      token: "prosemirror-link-preview",
    });
  }, [ydoc]);

  useEffect(() => {
    provider.connect();
    return () => {
      provider.disconnect();
    };
  }, [provider]);

  useEffect(() => {
    const yXmlFragment = ydoc.getXmlFragment("prosemirror");

    const v = new EditorView(document.querySelector("#editor") as HTMLElement, {
      state: EditorState.create({
        // doc: mySchema.nodeFromJSON(initialDoc),
        doc: DOMParser.fromSchema(mySchema).parse(
          document.createElement("div")
        ),
        plugins: [
          ...exampleSetup({ schema: mySchema }),
          ySyncPlugin(yXmlFragment),
          // yCursorPlugin(provider.awareness),
          yUndoPlugin(),
          previewPlugin(
            async (link: string) => {
              const data = await fetch("/api/link-preview", {
                method: "POST",
                body: JSON.stringify({
                  link,
                }),
              });
              const {
                data: { url, title, description, images },
              } = await data.json();
              return { url, title, description, images };
            },
            applyYjs,
            createDecorationsYjs,
            findPlaceholderYjs,
            { openLinkOnClick: false }
          ),
          plug(),
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
