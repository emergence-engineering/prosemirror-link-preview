import { Plugin, PluginKey } from "prosemirror-state";
import { Schema } from "prosemirror-model";
export declare const previewPluginKey: PluginKey<any>;
type PreviewPluginState = {
    pos: number;
    id: {};
}[];
export declare const previewPlugin: (schema: Schema, callback: (url: string) => Promise<any>) => Plugin<PreviewPluginState>;
export {};
