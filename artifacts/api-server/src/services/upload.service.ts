export async function processImageUpload(dataUrl: string): Promise<{ url: string }> {
  if (dataUrl.startsWith("data:")) {
    return { url: dataUrl };
  }

  if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
    return { url: dataUrl };
  }

  throw Object.assign(new Error("Invalid image data"), { status: 400 });
}
