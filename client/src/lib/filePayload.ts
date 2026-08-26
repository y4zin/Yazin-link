export type ReadableFile = {
  arrayBuffer: () => Promise<ArrayBuffer>;
};

/**
 * Reads a browser file once and preserves its bytes as Base64 for a reliable
 * direct upload. This avoids losing access to files selected from mobile apps.
 */
export async function captureFileContents(file: ReadableFile) {
  const buffer = await file.arrayBuffer();
  if (buffer.byteLength === 0) throw new Error("الملف المحدد فارغ.");

  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const chunks: string[] = [];

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    let binaryChunk = "";

    for (let characterIndex = 0; characterIndex < chunk.length; characterIndex += 1) {
      binaryChunk += String.fromCharCode(chunk[characterIndex]);
    }

    chunks.push(binaryChunk);
  }

  return btoa(chunks.join(""));
}
