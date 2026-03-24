/**
 * Centralized file type detection for note preview/lock logic.
 * Used by both download API and NoteViewer to ensure consistent behavior
 * across all image formats (jpg, png, webp, gif, heic, avif, etc.).
 */

/** Extensions recognized as image files (including common photo formats) */
export const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'jpe', 'jfif', 'png', 'gif', 'webp',
  'bmp', 'tiff', 'tif', 'avif', 'heic', 'heif', 'ico',
]);

/** Extensions recognized as PDF */
export const PDF_EXTENSIONS = new Set(['pdf']);

/**
 * Normalize extension string (lowercase, trimmed).
 */
export function normalizeExtension(ext: string | null | undefined): string {
  if (!ext || typeof ext !== 'string') return '';
  return ext.trim().toLowerCase().replace(/^\./, '');
}

/**
 * Check if content type indicates PDF.
 */
function isPdfContentType(contentType: string | null | undefined): boolean {
  if (!contentType || typeof contentType !== 'string') return false;
  return contentType.toLowerCase().includes('pdf');
}

/**
 * Check if content type indicates an image (image/*).
 */
function isImageContentType(contentType: string | null | undefined): boolean {
  if (!contentType || typeof contentType !== 'string') return false;
  return contentType.toLowerCase().startsWith('image/');
}

/**
 * Extract extension from URL (from path, before any query or hash).
 */
function extensionFromUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const match = url.match(/\.([a-z0-9]+)(?:\?|#|$)/i);
  return normalizeExtension(match ? match[1] : '');
}

export type FileTypeInput = {
  contentType?: string | null;
  extension?: string | null;
  url?: string | null;
};

/**
 * Check if file is PDF based on content-type, extension, or URL.
 * Content-type image/* takes precedence (never treat as PDF).
 */
export function isPdfFile(input: FileTypeInput): boolean {
  const { contentType, extension, url } = input;
  if (isImageContentType(contentType)) return false;
  const ext = normalizeExtension(extension) || extensionFromUrl(url);
  return (
    isPdfContentType(contentType) ||
    PDF_EXTENSIONS.has(ext) ||
    (typeof url === 'string' && url.toLowerCase().endsWith('.pdf'))
  );
}

/**
 * Check if file is an image based on content-type, extension, or URL.
 */
export function isImageFile(input: FileTypeInput): boolean {
  const { contentType, extension, url } = input;
  const ext = normalizeExtension(extension) || extensionFromUrl(url);
  return (
    isImageContentType(contentType) ||
    IMAGE_EXTENSIONS.has(ext) ||
    (typeof url === 'string' && /\.(jpg|jpeg|jpe|jfif|png|gif|webp|bmp|tiff?|avif|heic|heif|ico)$/i.test(url))
  );
}
