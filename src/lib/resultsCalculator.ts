import type {
  Candidate,
  CandidateResult,
  ElectionResultsSummary,
} from '../types/election';

export interface RawCandidateTally {
  candidate: Candidate;
  voteCount: number;
}

/**
 * Single authoritative client-side calculation utility for election results.
 * Guarantees mathematical precision, tie detection, zero-vote handling,
 * and stable sorting (votes descending, candidate_number ascending).
 */
export function calculateElectionResults(
  tallies: RawCandidateTally[],
  totalVotes: number,
  closedAt: string | null = null,
  startedAt: string | null = null,
  electionTitle: string = 'PEMILIHAN JENDRAL & DEWAN KEHORMATAN'
): ElectionResultsSummary {
  const isZeroVotes = totalVotes === 0;

  // 1. Calculate percentage for each candidate rounded to 2 decimal places
  const mappedResults: CandidateResult[] = tallies.map(({ candidate, voteCount }) => {
    let percentage = 0;
    if (!isZeroVotes && totalVotes > 0) {
      percentage = Number(((voteCount / totalVotes) * 100).toFixed(2));
    }
    return {
      candidate,
      voteCount,
      percentage,
      isWinner: false,
      isTied: false,
    };
  });

  // 2. Sort candidates: Vote count descending, tie-breaker: candidate_number ascending
  mappedResults.sort((a, b) => {
    if (b.voteCount !== a.voteCount) {
      return b.voteCount - a.voteCount;
    }
    return a.candidate.candidate_number - b.candidate.candidate_number;
  });

  // 3. Determine winner(s) and tie status
  if (isZeroVotes) {
    return {
      totalVotes: 0,
      candidateResults: mappedResults,
      isTie: false,
      isZeroVotes: true,
      winners: [],
      closedAt,
      startedAt,
      electionTitle,
    };
  }

  const highestVote = Math.max(...mappedResults.map((r) => r.voteCount), 0);
  const leaders = mappedResults.filter((r) => r.voteCount === highestVote);
  const isTie = leaders.length > 1;

  mappedResults.forEach((r) => {
    if (r.voteCount === highestVote) {
      if (isTie) {
        r.isTied = true;
      } else {
        r.isWinner = true;
      }
    }
  });

  return {
    totalVotes,
    candidateResults: mappedResults,
    isTie,
    isZeroVotes: false,
    winners: leaders.map((l) => l.candidate),
    closedAt,
    startedAt,
    electionTitle,
  };
}
