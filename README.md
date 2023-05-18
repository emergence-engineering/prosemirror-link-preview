# prosemirror-link-preview

## Features

The ProseMirror-Link-Preview plugin offers several key features that enhance the user experience while editing:

1. **Dynamic Link Previews**: Whenever a valid URL is pasted into a ProseMirror document, the plugin automatically calls **your callback** function, which is one of the plugin's parameter, which fetches the necessary metadata, and the plugin renders a preview, providing a quick glimpse into the content behind the link.

2. **Rich Preview Styles**: The link previews generated by the plugin are visually appealing, making it easier to differentiate between regular text and linked content. The preview includes information such as the title, description, and an image associated with the link, where available.

3. **Configurable Behavior**: The plugin provides configuration options, allowing users to customize the behavior and appearance of link previews according to their specific needs. From adjusting the preview size to defining custom CSS styles, the plugin offers flexibility to match the desired editing environment.

## How to use?

1. **Installation**: Install the plugin from your preferred package manager. For example, using npm, run the following command:
   `npm i -S prosemirror-link-preview`
2. **Import**: Import the plugin into your project. You also need to import some utility functions from the plugin to help with the configuration process.
   ```typescript
   import {
     previewPlugin,
     addPreviewNode,
     apply, // for plain prosemirror
     createDecorations, // for plain prosemirror
     findPlaceholder, // for plain prosemirror
     applyYjs, // for yjs users
     createDecorationsYjs, // for yjs users
     findPlaceholderYjs, // for yjs users
     IDefaultoptions,
   } from "prosemirror-link-preview";
   ```
3. Import the CSS file for your setup. You can use your custom css to style the preview, here is an example(which is the actual css used by default)

```typescript
import "prosemirror-link-preview/dist/styles/styles.css";
```

- basic card structure

```
<div className="preview-root">
  <div className="preview-image" />
  <div className="preview-title" />
  <div className="preview-description" />
</div>
```

4. Update the image node in the ProseMirror schema to have all the necessary properties with `addPreviewNode`

```typescript
const mySchema = new Schema({
  nodes: addPreviewNode(schema.spec.nodes),
  marks: schema.spec.marks,
});
```

5. Initialize the editor with the plugin

   ```typescript
   const v = new EditorView(document.querySelector("#editor") as HTMLElement, {
     state: EditorState.create({
       doc: DOMParser.fromSchema(mySchema).parse(document.createElement("div")),
       plugins: [
         ...exampleSetup({ schema: mySchema }),
         ySyncPlugin(yXmlFragment),
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
           findPlaceholderYjs
           {openLinkOnClick: true} as IDefaultoptions
         ),
       ],
     }),
   });
   ```

6. `previewPlugin` requires 5 parameters:

- `fetchLinkPreview`: a function that takes a link and returns a `Promise` that resolves to the link preview data, you can easily do this using next.js API routes
  or just using `link-preview-js` library on your custom backend

```typescript
import type { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import { getLinkPreview } from "link-preview-js";
// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = Cors({
  methods: ["POST", "GET", "HEAD"],
});
// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Run the middleware
  await runMiddleware(req, res, cors);

  const { link } = JSON.parse(req.body);
  console.log({ link });

  const data = await getLinkPreview(link);

  // Rest of the API logic
  res.json({ data });
}
```

- `apply`: import from `prosemirror-link-preview`
- `createDecorations`: import from `prosemirror-link-preview`
- `findPlaceholder`: import from `prosemirror-link-preview`
- `defaultOptions`:

```typescript
export interface IDefaultOptions {
  openLinkOnClick: boolean; // if true, onClick opens the original link in a new browser tab
}
```
