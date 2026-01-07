import { EditorState, Transaction, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import {
  absolutePositionToRelativePosition,
  relativePositionToAbsolutePosition,
  ySyncPluginKey as defaultYSyncPluginKey,
} from "y-prosemirror";
import { previewPluginKey, PreviewPluginState, IDefaultOptions } from "./types";

export const defaultOptions: IDefaultOptions = {
  openLinkOnClick: true,
  pasteLink: false,
};

export const createDecorationsYjs = (
  state: EditorState,
  customYSyncPluginKey?: PluginKey
) => {
  const updatedState = previewPluginKey.getState(state);
  if (!updatedState) return DecorationSet.empty;
  const key = customYSyncPluginKey || defaultYSyncPluginKey;
  const YState = key.getState(state);
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

export const createDecorations = (state: EditorState) => {
  const updatedState = previewPluginKey.getState(state);
  if (!updatedState) return DecorationSet.empty;
  const decors = updatedState.map((i) => {
    const widget = document.createElement("placeholder");
    const deco =
      typeof i.pos === "number"
        ? Decoration.widget(i.pos, widget, {
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

export const applyYjs = (
  tr: Transaction,
  value: PreviewPluginState,
  oldState: EditorState,
  newState: EditorState,
  customYSyncPluginKey?: PluginKey
) => {
  const action = tr.getMeta(previewPluginKey);
  if (action && action.type === "add") {
    const key = customYSyncPluginKey || defaultYSyncPluginKey;
    const YState = key.getState(newState);
    const relPos = absolutePositionToRelativePosition(
      action.pos,
      YState.type,
      YState.binding.mapping
    );
    return [
      ...value,
      {
        id: action.id as object,
        pos: relPos,
      },
    ];
  }

  if (action && action.type === "remove") {
    return value.filter((i) => i.id !== action.id);
  }

  return value;
};

export const apply = (tr: Transaction, value: PreviewPluginState) => {
  const action = tr.getMeta(previewPluginKey);

  const mappedValue = value.map((i) => {
    const pos = tr.mapping.map(i.pos);
    return {
      ...i,
      pos,
    };
  });

  if (action && action.type === "add") {
    return [
      ...mappedValue,
      {
        id: action.id as object,
        pos: action.pos,
      },
    ];
  }

  if (action && action.type === "remove") {
    return mappedValue.filter((i) => i.id !== action.id);
  }

  return mappedValue;
};

export const findPlaceholderYjs = (
  state: EditorState,
  id: any,
  customYSyncPluginKey?: PluginKey
) => {
  const decos = previewPluginKey.getState(state);
  if (!decos) {
    return null;
  }
  const key = customYSyncPluginKey || defaultYSyncPluginKey;
  const ystate = key.getState(state);
  const found = decos.find((spec) => spec.id === id);
  if (!found?.pos) {
    return null;
  }
  const absPos = relativePositionToAbsolutePosition(
    ystate.doc,
    ystate.type,
    found.pos,
    ystate.binding.mapping
  );
  return absPos;
};

export const findPlaceholder = (state: EditorState, id: any) => {
  const decos = previewPluginKey.getState(state);
  if (!decos) {
    return null;
  }
  const found = decos.find((spec) => spec.id === id);

  return found?.pos || null;
};
