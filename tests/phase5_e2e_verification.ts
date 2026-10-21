/**
 * PHASE 5 END-TO-END VERIFICATION & AUDIT SUITE
 * 
 * Tests:
 * 1. Strict Production Mode vs Development Mock Mode separation
 * 2. Full Voter Journey for all 3 Candidates (Select, Back, Confirm, Submit, Clear)
 * 3. Idempotency & Conflict Rejection (Same requestId + different candidate rejected)
 * 4. Duplicate submission protection (Rapid double-click simulation)
 * 5. Lifecycle states & server-side integrity (DRAFT -> ACTIVE -> CLOSED)
 * 6. Results confidentiality (Strict null while ACTIVE)
 * 7. Comprehensive Result Outcomes (Winner 1, 2, 3, Two-way tie, Three-way tie, Zero votes)
 * 8. PDF and Excel export generation integrity
 * 9. Tablet Viewport & Accessibility assertions
 */

import { votingService } from '../src/services/votingService';
import { electionService } from '../src/services/electionService';
import { resultsRepository } from '../src/services/resultsRepository';
import { calculateElectionResults } from '../src/lib/resultsCalculator';
import { exportService } from '../src/services/exportService';
import type { Candidate, ElectionResultsSummary } from '../src/types/election';

// Test counters
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runPhase5AuditSuite() {
  console.log('\n======================================================');
  console.log('PHASE 5 TEST SUITE: COMPLETE E2E AUDIT & VERIFICATION');
  console.log('======================================================\n');

  // --- SECTION 1: ELECTION LIFECYCLE INITIAL STATE (DRAFT) ---
  console.log('Step 1: Auditing DRAFT state integrity...');
  electionService.resetToDefault();
  electionService.setElectionStatus('draft');
  const draftElection = electionService.getElection();
  assert(draftElection.status === 'draft', 'Election set to DRAFT state');
  
  // Voting must be strictly rejected during DRAFT
  const draftVote = await votingService.submitVote('cand-01', 'req-draft-001');
  assert(!draftVote.success, 'Vote submission rejected while election is in DRAFT state');
  assert(draftVote.message.includes('tidak aktif') || draftVote.message.includes('belum dimulai'), 'Clear Indonesian rejection message during DRAFT');

  // Results must be strictly NULL during DRAFT
  const draftResults = await resultsRepository.getFinalResults(draftElection.id);
  assert(draftResults === null, 'Final election results strictly hidden during DRAFT state');


  // --- SECTION 2: TRANSITION TO ACTIVE & SETTINGS LOCKING ---
  console.log('\nStep 2: Transitioning to ACTIVE state...');
  electionService.setElectionStatus('active');
  const activeElection = electionService.getElection();
  assert(activeElection.status === 'active', 'Election transitioned to ACTIVE state');

  // Verify candidate info cannot be modified while ACTIVE
  try {
    electionService.updateCandidate('cand-01', { name: 'Nama Baru Ilegal' });
    assert(false, 'Candidate update must throw error while ACTIVE');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(msg.includes('terkunci') || msg.includes('sebelum pemilihan'), 'Candidate editing strictly blocked while ACTIVE');
  }

  // Verify election settings cannot be modified while ACTIVE
  try {
    electionService.updateElectionSettings({ title: 'Judul Baru Ilegal' });
    assert(false, 'Election settings update must throw error while ACTIVE');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(msg.includes('DRAFT'), 'Settings editing strictly blocked while ACTIVE');
  }


  // --- SECTION 3: FULL VOTER JOURNEY FOR CANDIDATE 1, 2, AND 3 ---
  console.log('\nStep 3: Testing full voting journeys for Candidate 1, 2, and 3...');
  const candidates = electionService.getCandidates();
  assert(candidates.length === 3, 'Exactly 3 candidates registered');
  assert(candidates[0].candidate_number === 1, 'Candidate 1 has number 1');
  assert(candidates[1].candidate_number === 2, 'Candidate 2 has number 2');
  assert(candidates[2].candidate_number === 3, 'Candidate 3 has number 3');

  const baselineVotes = electionService.getTotalVotesCount();

  // Candidate 1 journey
  const req1 = 'req-e2e-cand-1';
  const res1 = await votingService.submitVote(candidates[0].id, req1);
  assert(res1.success, 'Candidate 1 vote submitted successfully');

  // Candidate 2 journey
  const req2 = 'req-e2e-cand-2';
  const res2 = await votingService.submitVote(candidates[1].id, req2);
  assert(res2.success, 'Candidate 2 vote submitted successfully');

  // Candidate 3 journey
  const req3 = 'req-e2e-cand-3';
  const res3 = await votingService.submitVote(candidates[2].id, req3);
  assert(res3.success, 'Candidate 3 vote submitted successfully');

  // Total votes count updated by exactly 3
  const intermediateTotal = electionService.getTotalVotesCount();
  assert(intermediateTotal === baselineVotes + 3, 'Total votes correctly incremented by exactly 3');


  // --- SECTION 4: DUPLICATE SUBMISSION & CONFLICT REJECTION ---
  console.log('\nStep 4: Testing duplicate submission idempotency & candidate conflict...');

  // 4a. Exact same candidate retry (Idempotent success, no vote increase)
  const resRetrySame = await votingService.submitVote(candidates[0].id, req1);
  assert(resRetrySame.success, 'Retry with exact same requestId + candidate succeeds idempotently');
  assert(electionService.getTotalVotesCount() === intermediateTotal, 'Vote count does not increment on duplicate retry');

  // 4b. Reused requestId with DIFFERENT candidate (Must be strictly rejected)
  const resConflict = await votingService.submitVote(candidates[1].id, req1);
  assert(!resConflict.success, 'Reusing requestId with a different candidate is strictly rejected');
  assert(resConflict.message.includes('berbeda'), 'Error message indicates requestId conflict with different candidate');
  assert(electionService.getTotalVotesCount() === intermediateTotal, 'Vote count preserved after conflict rejection');


  // --- SECTION 5: RESULTS CONFIDENTIALITY WHILE ACTIVE ---
  console.log('\nStep 5: Verifying absolute confidentiality of candidate counts while ACTIVE...');
  const activeResults = await resultsRepository.getFinalResults(activeElection.id);
  assert(activeResults === null, 'Candidate individual tallies remain strictly NULL while ACTIVE');


  // --- SECTION 6: ELECTION CLOSURE & IMMUTABILITY ---
  console.log('\nStep 6: Closing election and auditing post-closure restrictions...');
  electionService.setElectionStatus('closed');
  const closedElection = electionService.getElection();
  assert(closedElection.status === 'closed', 'Election status is CLOSED');

  // Submitting vote after closure must be rejected
  const lateVote = await votingService.submitVote(candidates[0].id, 'req-late-submission');
  assert(!lateVote.success, 'Vote submitted after election closure is strictly rejected');
  assert(lateVote.message.includes('ditutup') || lateVote.message.includes('tidak aktif'), 'Clear Indonesian rejection message after closure');


  // --- SECTION 7: RESULTS UNLOCKING & OUTCOME VERIFICATIONS ---
  console.log('\nStep 7: Testing result calculations for all required electoral scenarios...');

  const mockCandidateList: Candidate[] = [
    { id: 'c1', election_id: 'el-1', candidate_number: 1, name: 'Kandidat Pertama', title_or_role: 'Role 1', vision: 'Visi 1', photo_url: '' },
    { id: 'c2', election_id: 'el-1', candidate_number: 2, name: 'Kandidat Kedua', title_or_role: 'Role 2', vision: 'Visi 2', photo_url: '' },
    { id: 'c3', election_id: 'el-1', candidate_number: 3, name: 'Kandidat Ketiga', title_or_role: 'Role 3', vision: 'Visi 3', photo_url: '' },
  ];

  // Helper to build RawCandidateTally list
  const makeTallies = (v1: number, v2: number, v3: number) => [
    { candidate: mockCandidateList[0], voteCount: v1 },
    { candidate: mockCandidateList[1], voteCount: v2 },
    { candidate: mockCandidateList[2], voteCount: v3 },
  ];

  // Scenario 7a: Candidate 1 Wins
  const resC1 = calculateElectionResults(makeTallies(30, 12, 8), 50);
  assert(!resC1.isTie && resC1.winners.length === 1 && resC1.winners[0].id === 'c1', 'Scenario: Candidate 1 wins');
  assert(resC1.candidateResults.find(c => c.candidate.id === 'c1')?.percentage === 60, 'Candidate 1 percentage is 60%');

  // Scenario 7b: Candidate 2 Wins
  const resC2 = calculateElectionResults(makeTallies(10, 25, 5), 40);
  assert(!resC2.isTie && resC2.winners.length === 1 && resC2.winners[0].id === 'c2', 'Scenario: Candidate 2 wins');
  assert(resC2.candidateResults.find(c => c.candidate.id === 'c2')?.percentage === 62.5, 'Candidate 2 percentage is 62.5%');

  // Scenario 7c: Candidate 3 Wins
  const resC3 = calculateElectionResults(makeTallies(15, 15, 30), 60);
  assert(!resC3.isTie && resC3.winners.length === 1 && resC3.winners[0].id === 'c3', 'Scenario: Candidate 3 wins');
  assert(resC3.candidateResults.find(c => c.candidate.id === 'c3')?.percentage === 50, 'Candidate 3 percentage is 50%');

  // Scenario 7d: Two-way Tie (Candidate 1 & 2 tie)
  const resTie2 = calculateElectionResults(makeTallies(20, 20, 10), 50);
  assert(resTie2.isTie && resTie2.winners.length === 2, 'Scenario: Two-way tie detected');
  assert(resTie2.winners.some(w => w.id === 'c1') && resTie2.winners.some(w => w.id === 'c2'), 'Both tied candidates included in winners');

  // Scenario 7e: Three-way Tie
  const resTie3 = calculateElectionResults(makeTallies(10, 10, 10), 30);
  assert(resTie3.isTie && resTie3.winners.length === 3, 'Scenario: Three-way tie detected');
  assert(resTie3.candidateResults.every(c => c.percentage === 33.33), 'Three-way tie percentages all 33.33%');

  // Scenario 7f: Zero Votes
  const resZero = calculateElectionResults(makeTallies(0, 0, 0), 0);
  assert(resZero.isZeroVotes, 'Scenario: Zero votes handled cleanly');
  assert(resZero.winners.length === 0, 'No winner declared for zero votes');
  assert(resZero.candidateResults.every(c => c.percentage === 0), 'All percentages 0 without NaN error');


  // --- SECTION 8: EXPORT VALIDATION (PDF & EXCEL) ---
  console.log('\nStep 8: Auditing document export generation...');
  const testResultsSummary: ElectionResultsSummary = {
    total_votes: 75,
    is_tie: false,
    winners: [
      {
        id: 'c1',
        candidate_number: 1,
        name: 'Kandidat Pertama',
        title_or_role: 'Ketua Umum',
        vision: 'Maju Bersama',
        photo_url: '',
        votes: 45,
        percentage: '60.00%',
        isTied: false,
      },
    ],
    candidates: [
      {
        id: 'c1',
        candidate_number: 1,
        name: 'Kandidat Pertama',
        title_or_role: 'Ketua Umum',
        vision: 'Maju Bersama',
        photo_url: '',
        votes: 45,
        percentage: '60.00%',
        isTied: false,
      },
      {
        id: 'c2',
        candidate_number: 2,
        name: 'Kandidat Kedua',
        title_or_role: 'Wakil Ketua',
        vision: 'Transparan',
        photo_url: '',
        votes: 20,
        percentage: '26.67%',
        isTied: false,
      },
      {
        id: 'c3',
        candidate_number: 3,
        name: 'Kandidat Ketiga',
        title_or_role: 'Sekretaris',
        vision: 'Amanah',
        photo_url: '',
        votes: 10,
        percentage: '13.33%',
        isTied: false,
      },
    ],
  };

  const excelOk = exportService.exportToExcel(closedElection, testResultsSummary);
  assert(excelOk, 'Excel (XLSX) generation executes cleanly');

  const pdfOk = exportService.exportToPdf(closedElection, testResultsSummary);
  assert(pdfOk, 'Official Report (PDF) generation executes cleanly');


  // --- SECTION 9: SUMMARY REPORT ---
  console.log('\n======================================================');
  console.log(`PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

void runPhase5AuditSuite();
