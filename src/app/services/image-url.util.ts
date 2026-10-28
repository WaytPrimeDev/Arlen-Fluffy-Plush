/**
 * The API hands out three URLs per photo, and only `full` keeps the photo's
 * own proportions: `mobile` and `thumbnail` are square `c_fill` crops
 * (`w_400,h_400` and `w_200,h_200`). They are fine for the square thumbnail
 * strip and wrong everywhere the photo is shown at its own aspect ratio —
 * including as the lightbox's placeholder, where a square stretched over a
 * landscape slide is plainly visible until the real photo arrives.
 *
 * So anything that shows the photo itself derives its URL from `full` with
 * `c_limit`, which only ever scales down and never crops.
 */
const CLOUDINARY_UPLOAD = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/**
 * A width-capped, aspect-preserving version of a Cloudinary image. `f_auto` and
 * `q_auto` let Cloudinary pick the format and quality, so the stage no longer
 * downloads a multi-megabyte original. URLs we do not recognise are returned
 * unchanged.
 */
export function scaledImage(url: string, width: number): string {
  const match = CLOUDINARY_UPLOAD.exec(url);
  if (!match) {
    return url;
  }

  const [, base, rest] = match;
  return `${base}c_limit,w_${width},f_auto,q_auto/${rest}`;
}

/** Width of the photo shown on the page, generous enough for a retina stage. */
export const STAGE_WIDTH = 900;

/** Width of the photo the lightbox opens. */
export const VIEWER_WIDTH = 1600;
