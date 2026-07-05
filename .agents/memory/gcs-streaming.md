---
name: GCS streaming pattern
description: How to correctly stream GCS objects to Express responses; pitfall with double Node↔Web stream conversion.
---

## Rule
Stream GCS files to Express using `file.createReadStream()` piped via `stream/promises pipeline()` directly. Never round-trip through `Readable.toWeb()` → `Readable.fromWeb()`.

## Why
The `downloadObject()` helper wrapped a Node.js Readable in a Web ReadableStream (`Readable.toWeb`), then the route unwrapped it back to a Node.js Readable (`Readable.fromWeb`) before piping. This double conversion had no error listeners on the intermediate stream. A GCS read failure or backpressure hiccup caused a silently truncated response: the browser received a partial PNG, fired `img.onerror`, and `Picture` showed `ImagePlaceholder` even though the file was accessible.

## How to apply
In storage route handlers:
```ts
import { pipeline } from "stream/promises";

const [metadata] = await objectFile.getMetadata();
res.status(200);
res.setHeader("Content-Type", (metadata.contentType as string) || "application/octet-stream");
res.setHeader("Cache-Control", `${isPublic ? "public" : "private"}, max-age=3600`);
if (metadata.size) res.setHeader("Content-Length", String(metadata.size));

const stream = objectFile.createReadStream();
stream.on("error", (err) => {
  req.log.error({ err }, "Error streaming object");
  if (!res.headersSent) res.status(500).json({ error: "Streaming failed" });
});
await pipeline(stream, res);
```

## Picture component companion fix
`failed` state in `Picture.tsx` was never reset when `src` changed. After a transient failure, navigating back would still show `ImagePlaceholder` for a valid image. Fix:
```ts
useEffect(() => { setFailed(false); }, [src]);
```
