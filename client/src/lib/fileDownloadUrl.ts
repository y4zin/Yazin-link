export function createFileDownloadUrl(fileUrl: string, fileName: string) {
  const url = new URL(fileUrl);
  const nameWithoutExtension = fileName.replace(/\.[^.]+$/, "").trim();

  // ImageKit sends Content-Disposition: attachment for this parameter, so all
  // visitors receive a download of the same stored resource.
  url.searchParams.set("ik-attachment", "true");
  if (nameWithoutExtension) {
    url.searchParams.set("ik-attachment-filename", nameWithoutExtension);
  }

  return url.toString();
}
