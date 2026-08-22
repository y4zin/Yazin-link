export type ReadableImageFile = {
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export async function captureImageContents(file: ReadableImageFile) {
  const buffer = await file.arrayBuffer();
  if (buffer.byteLength === 0) throw new Error("The selected image is empty.");

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
