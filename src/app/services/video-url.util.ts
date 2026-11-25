/**
 * The three URLs a YouTube video needs on a kitten page, built from the bare
 * id the API stores.
 *
 * The backend normalizes whatever the admin pasted — `watch?v=`, `youtu.be/`,
 * `/shorts/`, `/embed/`, `/live/`, with playlists and timecodes attached — down
 * to an id on write, and rejects anything that is not one. The id is therefore
 * the only thing that crosses the wire, and the URLs are assembled here.
 *
 * Building them rather than binding a stored URL is also what keeps the iframe
 * out of Angular's way: a `src` bound from API data would have to be waved
 * through with `bypassSecurityTrustResourceUrl`, which is exactly the check
 * worth keeping on data that the admin side can edit. A composed URL whose
 * only variable part is a validated id needs no exemption.
 */

/** What the backend accepts into the field, re-checked before anything is built. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export interface KittenVideo {
  id: string;
  /** Player URL, cookie-free until the visitor actually starts the video. */
  embed: string;
  /** The video's own page, for the "watch on YouTube" link. */
  watch: string;
  /** Poster frame, used as the slide's still and as its thumbnail. */
  thumb: string;
}

/**
 * The video of a kitten, or `null` when there is none.
 *
 * The id is re-validated here even though the backend already does it: this
 * runs against whatever the API happened to answer with, including an older
 * deployment that still stored a full URL in the field, and a bad value has to
 * drop the video rather than produce a broken player. `null`, `undefined` and
 * `''` are all simply "no video".
 */
export function kittenVideo(videoId: string | null | undefined): KittenVideo | null {
  const id = videoId?.trim();
  if (!id || !VIDEO_ID.test(id)) {
    return null;
  }

  return {
    id,
    // `nocookie` is the host that does not write identifiers until playback
    // starts, and `rel=0` keeps the end screen on this channel's own videos
    // rather than offering whatever YouTube would pick next.
    embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1&playsinline=1`,
    watch: `https://www.youtube.com/watch?v=${id}`,
    // `hqdefault` is the one size every video has: the larger `maxresdefault`
    // is missing for anything uploaded below 1080p and would 404 into a blank
    // slide, and it is served letterboxed to 480×360 regardless.
    thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}
