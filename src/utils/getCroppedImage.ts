import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

/**
 * Crops a region from an image URL (e.g. object URL) to a JPEG blob.
 * `pixelCrop` must come from react-easy-crop's `onCropComplete` (pixel space).
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  quality = 0.92
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const { width, height } = pixelCrop;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    width,
    height,
    0,
    0,
    width,
    height
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas toBlob failed"));
        }
      },
      "image/jpeg",
      quality
    );
  });
}
