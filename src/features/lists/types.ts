/** What a card on the Lists home shows. Filled from the local DB in Phase 2. */
export type ListSummary = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  openCount: number;
  members: { id: string; name: string; avatarUrl: string | null }[];
  lastActivityAt: string | null;
};
