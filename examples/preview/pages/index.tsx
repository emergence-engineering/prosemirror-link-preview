import * as Y from "yjs";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { useEffect, useMemo, useState } from "react";
import applyDevTools from "prosemirror-dev-tools";
import { ySyncPlugin, yUndoPlugin } from "y-prosemirror";
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
