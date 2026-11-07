/**
 * Window events crossing the component graph. One home for each name so the
 * dispatcher and the listener can never drift apart by typo.
 */

/** Ask the Navbar to open the ⌘K search palette (it owns dialog state and
 * focus return). Dispatched by SearchPill + BottomNav; listened by Navbar. */
export const OPEN_SEARCH_EVENT = 'gofar:open-search';
