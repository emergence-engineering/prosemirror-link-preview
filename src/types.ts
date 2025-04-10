import { PluginKey } from "prosemirror-state";

export interface IDefaultOptions {
  openLinkOnClick: boolean;
  pasteLink?: boolean;
}

export type PreviewPluginState = {
  pos: number;
  id: object;
}[];

export const previewPluginKey = new PluginKey<PreviewPluginState>(
  "previewPlugin"
);
