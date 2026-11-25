/**
 * How a kitten or a parent is addressed in a URL, and how that address is read
 * back against the API.
 *
 * The public pages are built on slugs — `/kittens/arlen-luna` rather than
 * `/kittens/66f0...` — because the slug is the part of the URL that says what
 * the page is about. The `_id` stays the primary key: it is what the relations
 * hold, so renaming a slug rearranges addresses without breaking any data.
 *
 * Both forms have to keep working. Slugs arrived after the site had already
 * been indexed and linked to by id, and the backend still serves
 * `/cats/kitten/:id`, so an id in the URL resolves rather than 404s. Which
 * endpoint answers is therefore decided from the shape of the value in the
 * URL, not from a flag somewhere.
 */

/** A Mongo `_id` as it appears in a URL: 24 hex characters and nothing else. */
const OBJECT_ID = /^[0-9a-f]{24}$/i;

/** Addressable by either key; both are optional on the wire. */
interface Addressable {
  _id: string;
  slug?: string | null;
}

/**
 * The URL segment for a record: its slug when the API sent one, otherwise its
 * id. A deployment that has not started minting slugs yet therefore keeps
 * producing id links instead of `/kittens/undefined`.
 */
export function catRouteParam(entity: Addressable): string {
  return entity.slug?.trim() || entity._id;
}

/** True when a URL segment is an `_id` rather than a slug. */
export function isObjectId(param: string): boolean {
  return OBJECT_ID.test(param.trim());
}
