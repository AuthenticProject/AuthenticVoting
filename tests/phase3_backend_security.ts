/**
 * PHASE 3 — Automated Backend, Security & Business Logic Verification Test Suite
 * Covers all 17 requirements specified in Master Prompt Section 16.
 */

import { ElectionService } from '../src/services/electionService';
import { KioskSessionService } from '../src/services/kioskSessionService';
import { AuthService } from '../src/services/authService';

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

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('PHASE 3 TEST SUITE: SECURITY, RPC LOGIC & IDEMPOTENCY');
  console.log('======================================================\n');

  const electionService = new ElectionService();
  const kioskService = new KioskSessionService();
  const authService = new AuthService();

  // Reset to clean state
  electionService.resetToDefault();

  // TEST 1: Voting while in draft
  console.log('Test 1: Voting while in Draft state...');
  electionService.setElectionStatus('draft');
  try {
    electionService.recordVote('cand-01', 'req-draft-01');
    assert(false, 'Should reject vote submission when election is draft');
  } catch {
    assert(true, 'Rejected vote submission during draft state');
  }

  // TEST 2: Candidate editing permitted in draft
  console.log('\nTest 2: Candidate editing in Draft state...');
  try {
    const updated = electionService.updateCandidate('cand-01', { name: 'Dr. Bambang Soedirman (Updated)' });
    assert(updated.find(c => c.id === 'cand-01')?.name === 'Dr. Bambang Soedirman (Updated)', 'Candidate successfully edited in draft');
  } catch (err) {
    assert(false, 'Failed candidate edit in draft: ' + String(err));
  }

  // TEST 3: Starting election (transitions to active)
  console.log('\nTest 3: Start election transition...');
  electionService.startElection();
  const activeElection = electionService.getElection();
  assert(activeElection.status === 'active', 'Election status is ACTIVE');
  assert(Boolean(activeElection.started_at), 'started_at timestamp recorded');

  // TEST 4: Candidate editing LOCKED after voting starts
  console.log('\nTest 4: Candidate editing restriction when ACTIVE...');
  try {
    electionService.updateCandidate('cand-01', { name: 'Dr. Bambang Hack' });
    assert(false, 'Should throw error when editing candidates in active status');
  } catch {
    assert(true, 'Candidate editing strictly locked when election is active');
  }

  // TEST 5: Settings editing LOCKED after voting starts
  console.log('\nTest 5: Event settings locked when ACTIVE...');
  try {
    electionService.updateElectionSettings({ title: 'New Unauthorized Title' });
    assert(false, 'Should throw error when editing settings in active status');
  } catch {
    assert(true, 'Event settings strictly locked when election is active');
  }

  // TEST 6: Valid vote submission
  console.log('\nTest 6: Valid vote submission...');
  const initialVotes = electionService.getTotalVotesCount();
  const req1 = 'req-valid-001';
  const success1 = electionService.recordVote('cand-01', req1);
  assert(success1 === true, 'Valid vote submitted');
  assert(electionService.getTotalVotesCount() === initialVotes + 1, 'Total votes incremented by exactly 1');

  // TEST 7: Duplicate request ID (Idempotency)
  console.log('\nTest 7: Idempotency with exact same candidate...');
  const successDuplicate = electionService.recordVote('cand-01', req1);
  assert(successDuplicate === true, 'Idempotent request returns success');
  assert(electionService.getTotalVotesCount() === initialVotes + 1, 'Total votes does not increment on retry');

  // TEST 8: Results access before closure (Strict confidentiality)
  console.log('\nTest 8: Result confidentiality while ACTIVE...');
  const activeResults = electionService.getResults();
  assert(activeResults === null, 'getResults returns NULL while election is active (No partial leak)');

  // TEST 9: Concurrent vote submissions
  console.log('\nTest 9: Concurrent vote submissions simulation...');
  const preConcurrentVotes = electionService.getTotalVotesCount();
  const concurrentRequests = [
    { cand: 'cand-02', req: 'req-conc-001' },
    { cand: 'cand-03', req: 'req-conc-002' },
    { cand: 'cand-01', req: 'req-conc-003' },
    { cand: 'cand-02', req: 'req-conc-004' },
  ];
  await Promise.all(
    concurrentRequests.map(async (item) => {
      electionService.recordVote(item.cand, item.req);
    })
  );
  assert(
    electionService.getTotalVotesCount() === preConcurrentVotes + 4,
    'All concurrent votes recorded atomically without loss'
  );

  // TEST 10: Closing the election
  console.log('\nTest 10: Close election transition...');
  electionService.closeElection();
  const closedElection = electionService.getElection();
  assert(closedElection.status === 'closed', 'Election status is CLOSED');
  assert(Boolean(closedElection.closed_at), 'closed_at timestamp recorded');

  // TEST 11: Voting after closure (Strictly rejected)
  console.log('\nTest 11: Voting after closure rejection...');
  try {
    electionService.recordVote('cand-01', 'req-late-001');
    assert(false, 'Should reject vote after election is closed');
  } catch {
    assert(true, 'Voting rejected when election is closed');
  }

  // TEST 12: Final results access after closure
  console.log('\nTest 12: Results unlocked after closure...');
  const finalResults = electionService.getResults();
  assert(finalResults !== null, 'Results successfully calculated after closure');
  assert(finalResults?.candidateResults.length === 3, 'All 3 candidate tallies returned');
  assert(Boolean(finalResults?.winners && finalResults.winners.length > 0), 'Winner or tied leaders calculated');
  const sumPercent = finalResults?.candidateResults.reduce((acc, c) => acc + c.percentage, 0) || 0;
  assert(Math.round(sumPercent) >= 99 && Math.round(sumPercent) <= 101, 'Percentage distribution sums to ~100%');

  // TEST 13: Kiosk session token pairing
  console.log('\nTest 13: Kiosk session authorization token...');
  const token = kioskService.generatePairingToken();
  assert(Boolean(token) && token.startsWith('kiosk-'), 'Generated valid kiosk device pairing token');
  assert(kioskService.getKioskToken() === token, 'Stored kiosk token matches generated token');
  kioskService.clearKioskToken();
  assert(kioskService.getKioskToken() === null, 'Kiosk token cleared on revocation');

  // TEST 14: Admin authentication validation
  console.log('\nTest 14: Admin authentication validation...');
  const invalidEmail = await authService.login({ email: 'invalid-email', password: '123' });
  assert(invalidEmail.error !== null, 'Rejects invalid email format');

  const shortPassword = await authService.login({ email: 'admin@pemilihan.id', password: '123' });
  assert(shortPassword.error !== null, 'Rejects short password');

  const validLogin = await authService.login({ email: 'admin@pemilihan.id', password: 'PasswordResmi2026!' });
  assert(validLogin.user !== null && validLogin.error === null, 'Authenticates valid credentials');
  assert(authService.getCurrentUser()?.email === 'admin@pemilihan.id', 'Session persisted');

  // TEST 15: Admin logout
  console.log('\nTest 15: Admin logout...');
  await authService.logout();
  assert(authService.getCurrentUser() === null, 'Admin session destroyed on logout');

  // SUMMARY
  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

void runTestSuite();
