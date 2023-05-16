import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
export declare const previewNodeView: (node: Node, view: EditorView, getPos: () => number | undefined) => {
    dom: HTMLDivElement;
    update: (node: Node) => boolean;
    selectNode: () => void;
    deselectNode: () => void;
    destroy: () => void;
};
