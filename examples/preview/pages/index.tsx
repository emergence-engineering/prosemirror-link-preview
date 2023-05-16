import * as Y from "yjs";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser, Node, Slice, Fragment } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { useEffect, useMemo, useState } from "react";
import applyDevTools from "prosemirror-dev-tools";
import { ySyncPlugin, yCursorPlugin, yUndoPlugin } from "y-prosemirror";
import { addPreviewNode, previewPlugin } from "prosemirror-link-preview";
import "prosemirror-link-preview/dist/styles/styles.css";
import { HocuspocusProvider } from "@hocuspocus/provider";
const mySchema = new Schema({
  nodes: addPreviewNode(schema.spec.nodes).addToEnd("placeholder", {
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
        tag: "div.placeholder",
      },
    ],
    toDOM(node) {
      return ["div", { class: "placeholder" }];
    },
  }),
  marks: schema.spec.marks,
});

const preview = mySchema.nodes.preview;

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
          yCursorPlugin(provider.awareness),
          yUndoPlugin(),
          previewPlugin(mySchema, async (link: string) => {
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
          }),
        ],
      }),
    });
    setView(v);

    v && applyDevTools(v);

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
