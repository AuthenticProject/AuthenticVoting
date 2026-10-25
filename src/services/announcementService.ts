import type {
  AnnouncementSession,
  Candidate,
  CandidateResult,
  ElectionResultsSummary,
  ElectionStatus,
  GroupCandidateAllocation,
  AllocationSummary,
} from '../types/election';

export class AnnouncementService {
  /**
   * Sorts candidate results by official ranking (vote count descending, preserves ties).
   */
  sortAndRankCandidates(candidateResults: CandidateResult[]): Array<CandidateResult & { rank: number }> {
    // Sort descending by voteCount; tiebreak with candidate_number for stable sorting
    const sorted = [...candidateResults].sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }
      return a.candidate.candidate_number - b.candidate.candidate_number;
    });

    // Assign official ranks (candidates with equal voteCount share the same rank)
    let currentRank = 1;
    return sorted.map((item, index) => {
      if (index > 0 && item.voteCount === sorted[index - 1].voteCount) {
        // Tied with previous candidate
        return { ...item, rank: sorted[index - 1].rank || currentRank, isTied: true };
      } else {
        currentRank = index + 1;
        // Check if tied with next candidate
        const isTied = index < sorted.length - 1 && item.voteCount === sorted[index + 1].voteCount;
        return { ...item, rank: currentRank, isTied };
      }
    });
  }

  /**
   * Allocates candidates into groups for each announcement event based on configured selection methods,
   * limits, exclusive partitioning, and tie handling policies.
   */
  calculateAllocation(
    sessions: AnnouncementSession[],
    allCandidates: Candidate[],
    results: ElectionResultsSummary | null,
    electionStatus: ElectionStatus
  ): AllocationSummary {
    const sortedSessions = [...sessions].sort((a, b) => a.display_order - b.display_order);

    // Prepare ranked candidate results list
    let rankedCandidates: Array<CandidateResult & { rank: number }> = [];
    if (results && results.candidateResults && results.candidateResults.length > 0) {
      rankedCandidates = this.sortAndRankCandidates(results.candidateResults);
    } else {
      // In draft or before results: use active candidates with 0 votes
      rankedCandidates = allCandidates.map((c, idx) => ({
        candidate: c,
        voteCount: 0,
        percentage: 0,
        isWinner: false,
        isTied: false,
        rank: idx + 1,
      }));
    }

    const groups: GroupCandidateAllocation[] = [];
    const assignedCandidateIdsAcrossExclusive = new Set<string>();
    const candidateAssignmentFrequency: Record<string, string[]> = {};

    for (const session of sortedSessions) {
      let candidatePool: Array<CandidateResult & { rank: number }> = [];

      if (session.exclusive_grouping) {
        // Pool excludes candidates already allocated in previous exclusive sessions
        candidatePool = rankedCandidates.filter(
          (cr) => !assignedCandidateIdsAcrossExclusive.has(cr.candidate.id)
        );
      } else {
        // Non-exclusive session can pick from entire candidate roster
        candidatePool = [...rankedCandidates];
      }

      let selected: Array<CandidateResult & { rank: number; isTieAtBoundary?: boolean }> = [];
      let isTieAtBoundary = false;
      let tiedCandidates: CandidateResult[] = [];

      const limit = Math.max(1, session.candidate_limit);

      if (session.selection_method === 'highest_votes') {
        // Select top candidates from pool
        const potential = [...candidatePool].sort((a, b) => {
          if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
          return a.candidate.candidate_number - b.candidate.candidate_number;
        });

        // Detect tie at the boundary
        if (potential.length > limit) {
          const boundaryVote = potential[limit - 1].voteCount;
          const nextVote = potential[limit].voteCount;

          if (boundaryVote === nextVote && boundaryVote > 0) {
            isTieAtBoundary = true;
            // Identify all candidates in the pool sharing this exact vote total
            tiedCandidates = potential.filter((c) => c.voteCount === boundaryVote);

            if (session.tie_policy === 'expand') {
              // Expand group to include all tied candidates at the boundary
              selected = potential.filter(
                (c) => c.voteCount > boundaryVote || c.voteCount === boundaryVote
              );
            } else {
              // strict or manual: take initial limit
              selected = potential.slice(0, limit);
            }
          } else {
            selected = potential.slice(0, limit);
          }
        } else {
          selected = [...potential];
        }
      } else if (session.selection_method === 'lowest_votes') {
        // Select lowest vote totals from pool
        const potential = [...candidatePool].sort((a, b) => {
          if (a.voteCount !== b.voteCount) return a.voteCount - b.voteCount;
          return a.candidate.candidate_number - b.candidate.candidate_number;
        });

        if (potential.length > limit) {
          const boundaryVote = potential[limit - 1].voteCount;
          const nextVote = potential[limit].voteCount;
          if (boundaryVote === nextVote && boundaryVote > 0) {
            isTieAtBoundary = true;
            tiedCandidates = potential.filter((c) => c.voteCount === boundaryVote);
            if (session.tie_policy === 'expand') {
              selected = potential.filter(
                (c) => c.voteCount < boundaryVote || c.voteCount === boundaryVote
              );
            } else {
              selected = potential.slice(0, limit);
            }
          } else {
            selected = potential.slice(0, limit);
          }
        } else {
          selected = [...potential];
        }
      } else if (session.selection_method === 'next_ranking_group') {
        // Select next available candidates based on descending overall ranking
        const potential = [...candidatePool].sort((a, b) => {
          if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
          return a.candidate.candidate_number - b.candidate.candidate_number;
        });

        if (potential.length > limit) {
          const boundaryVote = potential[limit - 1].voteCount;
          const nextVote = potential[limit].voteCount;

          if (boundaryVote === nextVote && boundaryVote > 0) {
            isTieAtBoundary = true;
            tiedCandidates = potential.filter((c) => c.voteCount === boundaryVote);

            if (session.tie_policy === 'expand') {
              selected = potential.filter(
                (c) => c.voteCount > boundaryVote || c.voteCount === boundaryVote
              );
            } else {
              selected = potential.slice(0, limit);
            }
          } else {
            selected = potential.slice(0, limit);
          }
        } else {
          selected = [...potential];
        }
      } else if (session.selection_method === 'manual') {
        // Manual assignment by administrator
        const manualIds = new Set(session.manual_candidate_ids || []);
        selected = candidatePool
          .filter((cr) => manualIds.has(cr.candidate.id))
          .slice(0, limit);
      }

      // Mark tie at boundary on affected candidate objects
      if (isTieAtBoundary) {
        selected = selected.map((c) => ({
          ...c,
          isTieAtBoundary: tiedCandidates.some((tc) => tc.candidate.id === c.candidate.id),
        }));
      }

      // Track assignments
      for (const item of selected) {
        if (session.exclusive_grouping) {
          assignedCandidateIdsAcrossExclusive.add(item.candidate.id);
        }
        if (!candidateAssignmentFrequency[item.candidate.id]) {
          candidateAssignmentFrequency[item.candidate.id] = [];
        }
        candidateAssignmentFrequency[item.candidate.id].push(session.name);
      }

      groups.push({
        session,
        candidates: selected,
        isTieAtBoundary,
        tiedCandidates,
      });
    }

    // Determine unallocated candidates
    const allAssignedIds = new Set(
      groups.flatMap((g) => g.candidates.map((c) => c.candidate.id))
    );
    const unallocatedCandidates = allCandidates.filter((c) => !allAssignedIds.has(c.id));

    // Determine duplicates across events
    const duplicateAssignments: Array<{ candidate: Candidate; eventNames: string[] }> = [];
    for (const [candidateId, eventNames] of Object.entries(candidateAssignmentFrequency)) {
      if (eventNames.length > 1) {
        const cand = allCandidates.find((c) => c.id === candidateId);
        if (cand) {
          duplicateAssignments.push({ candidate: cand, eventNames });
        }
      }
    }

    // Partition validation
    const validationErrors: string[] = [];
    let isValidPartition = true;

    // Check if exclusive sessions have any overlap
    const exclusiveGroups = groups.filter((g) => g.session.exclusive_grouping);
    if (exclusiveGroups.length > 1) {
      const exclusiveSeen = new Set<string>();
      for (const grp of exclusiveGroups) {
        for (const c of grp.candidates) {
          if (exclusiveSeen.has(c.candidate.id)) {
            validationErrors.push(
              `Kandidat "${c.candidate.name}" terdistribusi ganda pada beberapa acara dengan partisi eksklusif.`
            );
            isValidPartition = false;
          }
          exclusiveSeen.add(c.candidate.id);
        }
      }

      // Check full partition match if election is closed
      if (electionStatus === 'closed' && unallocatedCandidates.length > 0) {
        const isStrictPartitionMode = sortedSessions.every((s) => s.exclusive_grouping);
        if (isStrictPartitionMode) {
          validationErrors.push(
            `Terdapat ${unallocatedCandidates.length} kandidat yang belum teralokasi ke dalam sesi acara pengumuman mana pun.`
          );
          isValidPartition = false;
        }
      }
    }

    return {
      totalCandidates: allCandidates.length,
      totalEvents: sessions.length,
      allocatedCandidatesCount: allAssignedIds.size,
      unallocatedCandidates,
      duplicateAssignments,
      isValidPartition,
      validationErrors,
      groups,
    };
  }
}

export const announcementService = new AnnouncementService();
