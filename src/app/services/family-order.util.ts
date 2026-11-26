import { familyMemberId, type FamilyApiItem } from './families.service';

/**
 * The position given to anything the backend did not order: a litter whose
 * record the listing could not deliver, a litter saved without a
 * `displayOrder`, or a kitten its own litter does not list. They sort after
 * everything that has a place.
 */
const UNORDERED = Number.MAX_SAFE_INTEGER;

/** All the ordering needs from a kitten: its id and the litter it points at. */
export interface FamilyOrderMember {
  readonly id: string;
  readonly familyId: string | null;
}

/** Which litter lists a kitten, and where in that litter's own list. */
interface Placement {
  readonly familyId: string;
  readonly index: number;
}

export interface FamilyOrder {
  /**
   * Every litter that has a record or at least one kitten, in the order it is
   * displayed in.
   */
  readonly familyIds: readonly string[];
  /** The record behind an id, when the listing delivered it. */
  family(familyId: string): FamilyApiItem | undefined;
  /**
   * The one litter a kitten is shown under, so no kitten is rendered twice and
   * the grouped view holds exactly the kittens of the flat list.
   */
  familyOf(member: FamilyOrderMember): string | null;
  /** Puts kittens in litter order, and inside a litter in its own order. */
  compareKittens(a: FamilyOrderMember, b: FamilyOrderMember): number;
}

/**
 * The one order the catalogue is displayed in: litters by their
 * `displayOrder`, and the kittens of a litter by their position in that
 * litter's own `kittens` list.
 *
 * It is built from both sides of the link rather than from the families
 * listing alone. A litter whose record did not arrive is still named by the
 * `familyId` its kittens carry, so it keeps its card and its kittens instead
 * of vanishing from the grouping; it only loses the place `displayOrder` would
 * have given it, and sorts after the litters that have one.
 *
 * The flat list of kittens and the grouped view share this, which is what
 * makes them the same sequence cut two ways — a breed page and the whole
 * catalogue included, since a breed page is this order with the other breeds
 * left out.
 */
export function buildFamilyOrder(
  families: readonly FamilyApiItem[],
  kittens: readonly FamilyOrderMember[],
): FamilyOrder {
  const records = new Map(families.map((family) => [family._id, family]));

  const familyIds = [
    ...new Set([
      ...records.keys(),
      ...kittens.map((kitten) => kitten.familyId).filter((id): id is string => id !== null),
    ]),
  ].sort((a, b) => compareRecords(records.get(a), records.get(b)) || a.localeCompare(b));

  const familyRank = new Map(familyIds.map((id, index) => [id, index]));

  /**
   * Where each litter's own `kittens` array puts the kittens it lists. Walked
   * in display order and first claim wins, so a kitten two litters both list
   * lands in the earlier one rather than in both.
   */
  const placements = new Map<string, Placement>();
  for (const familyId of familyIds) {
    (records.get(familyId)?.kittens ?? []).forEach((member, index) => {
      const memberId = familyMemberId(member);
      if (memberId !== null && !placements.has(memberId)) {
        placements.set(memberId, { familyId, index });
      }
    });
  }

  // The order the listing itself came in, as the last tie-break: it keeps the
  // sort stable for kittens their litter does not place.
  const arrivalRank = new Map(kittens.map((kitten, index) => [kitten.id, index]));

  /**
   * The kitten's own `familyId` decides, because that is the link the API
   * fills in; a litter's `kittens` array is the fallback for a kitten that
   * carries no `familyId` of its own.
   */
  const familyOf = (member: FamilyOrderMember): string | null =>
    member.familyId ?? placements.get(member.id)?.familyId ?? null;

  const familyPos = (member: FamilyOrderMember): number => {
    const familyId = familyOf(member);
    return (familyId === null ? undefined : familyRank.get(familyId)) ?? UNORDERED;
  };

  const litterPos = (member: FamilyOrderMember): number => {
    const placement = placements.get(member.id);
    // Only the litter the kitten is actually shown under gets to place it.
    return placement && placement.familyId === familyOf(member) ? placement.index : UNORDERED;
  };

  return {
    familyIds,
    family: (familyId) => records.get(familyId),
    familyOf,
    compareKittens: (a, b) =>
      familyPos(a) - familyPos(b) ||
      litterPos(a) - litterPos(b) ||
      (arrivalRank.get(a.id) ?? 0) - (arrivalRank.get(b.id) ?? 0),
  };
}

function compareRecords(a: FamilyApiItem | undefined, b: FamilyApiItem | undefined): number {
  return orderOf(a) - orderOf(b) || (a?.name?.trim() ?? '').localeCompare(b?.name?.trim() ?? '');
}

function orderOf(family: FamilyApiItem | undefined): number {
  return typeof family?.displayOrder === 'number' ? family.displayOrder : UNORDERED;
}
