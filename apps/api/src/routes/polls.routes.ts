import { Router, Response } from 'express';
import { DatabaseStore } from '../db';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { Poll, CreatePollRequest, SubmitPollResponseRequest } from '@mivo/types';

export const pollsRouter = Router();

// Helper to verify if the requester is the host of the meeting
function checkIsHost(req: AuthenticatedRequest, meetingId: string): boolean {
  const db = DatabaseStore.getInstance();
  // Check in database meetings by publicMeetingId or internal ID
  let meeting = Array.from(db.meetings.values()).find(
    (m) => m.publicMeetingId === meetingId || m.id === meetingId
  );

  // If user is authenticated and matches hostId
  if (req.user && meeting && meeting.hostId === req.user.id) {
    return true;
  }

  // Check header or query override if using guest host session
  const hostHeader = req.headers['x-mivo-is-host'];
  if (hostHeader === 'true' || hostHeader === '1') {
    return true;
  }

  // If meeting doesn't exist in persistent store (e.g. instant room), check creator id
  if (req.user && (!meeting || meeting.hostId === req.user.id)) {
    return true;
  }

  return false;
}

// Helper to get participant identity
function getParticipantIdentity(req: AuthenticatedRequest): { id: string; name: string } {
  if (req.user) {
    return { id: req.user.id, name: req.user.name };
  }
  const peerIdHeader = (req.headers['x-mivo-peer-id'] as string) || (req.query.peerId as string);
  const nameHeader = (req.headers['x-mivo-display-name'] as string) || (req.query.displayName as string);
  return {
    id: peerIdHeader || (req.body && req.body.participantId) || 'guest_user',
    name: nameHeader || (req.body && req.body.participantName) || 'Participant',
  };
}

// ==========================================
// 1. GET /api/meetings/:meetingId/polls
// ==========================================
pollsRouter.get('/:meetingId/polls', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { meetingId } = req.params;
  const isHost = checkIsHost(req, meetingId);
  const participant = getParticipantIdentity(req);
  const db = DatabaseStore.getInstance();

  const polls = db.getMeetingPolls(meetingId, isHost, participant.id);

  return res.json({
    success: true,
    data: polls,
    meta: {
      isHost,
      totalCount: polls.length,
      timestamp: new Date().toISOString(),
    },
  });
});

// ==========================================
// 2. POST /api/meetings/:meetingId/polls (Host only: Create Poll)
// ==========================================
pollsRouter.post('/:meetingId/polls', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { meetingId } = req.params;
  const isHost = checkIsHost(req, meetingId);

  if (!isHost) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only the meeting host can create polls' },
    });
  }

  const { question, options, pollType, isAnonymous, allowResponseChange, showResultsToParticipants } = req.body as CreatePollRequest;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Poll question is required' },
    });
  }

  if (!Array.isArray(options) || options.filter((o) => typeof o === 'string' && o.trim().length > 0).length < 2) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'At least 2 non-empty answer options are required' },
    });
  }

  const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
  const hostIdentity = getParticipantIdentity(req);
  const db = DatabaseStore.getInstance();

  const newPoll = db.createPoll({
    meetingId,
    hostId: req.user?.id || hostIdentity.id,
    hostName: req.user?.name || hostIdentity.name,
    question,
    options: validOptions,
    pollType: pollType || 'single',
    isAnonymous,
    allowResponseChange,
    showResultsToParticipants,
  });

  return res.status(201).json({
    success: true,
    data: newPoll,
    message: 'Poll created successfully in draft status',
  });
});

// ==========================================
// 3. POST /api/meetings/:meetingId/polls/:pollId/start (Host only: Start Poll)
// ==========================================
pollsRouter.post('/:meetingId/polls/:pollId/start', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { meetingId, pollId } = req.params;
  const isHost = checkIsHost(req, meetingId);

  if (!isHost) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only the meeting host can start polls' },
    });
  }

  const db = DatabaseStore.getInstance();
  const fallbackData = req.body && req.body.poll ? req.body.poll : req.body;
  const poll = db.startPoll(pollId, req.user?.id || 'host_id', fallbackData);

  if (!poll) {
    return res.status(404).json({
      success: false,
      error: { code: 'POLL_NOT_FOUND', message: 'Poll not found' },
    });
  }

  return res.json({
    success: true,
    data: poll,
    message: 'Poll is now active and accepting participant responses',
  });
});

// ==========================================
// 4. POST /api/meetings/:meetingId/polls/:pollId/close (Host only: Close Poll)
// ==========================================
pollsRouter.post('/:meetingId/polls/:pollId/close', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { meetingId, pollId } = req.params;
  const isHost = checkIsHost(req, meetingId);

  if (!isHost) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only the meeting host can close polls' },
    });
  }

  const db = DatabaseStore.getInstance();
  const poll = db.closePoll(pollId, req.user?.id || 'host_id');

  if (!poll) {
    return res.status(404).json({
      success: false,
      error: { code: 'POLL_NOT_FOUND', message: 'Poll not found' },
    });
  }

  const results = db.getPollResults(pollId, true);

  return res.json({
    success: true,
    data: { poll, results },
    message: 'Poll closed. No further responses will be accepted',
  });
});

// ==========================================
// 5. POST /api/meetings/:meetingId/polls/:pollId/reopen (Host only: Reopen Poll)
// ==========================================
pollsRouter.post('/:meetingId/polls/:pollId/reopen', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { meetingId, pollId } = req.params;
  const isHost = checkIsHost(req, meetingId);

  if (!isHost) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only the meeting host can reopen polls' },
    });
  }

  const db = DatabaseStore.getInstance();
  const poll = db.reopenPoll(pollId, req.user?.id || 'host_id');

  if (!poll) {
    return res.status(404).json({
      success: false,
      error: { code: 'POLL_NOT_FOUND', message: 'Poll not found' },
    });
  }

  return res.json({
    success: true,
    data: poll,
    message: 'Poll reopened successfully',
  });
});

// ==========================================
// 6. DELETE /api/meetings/:meetingId/polls/:pollId (Host only: Delete Poll)
// ==========================================
pollsRouter.delete('/:meetingId/polls/:pollId', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { meetingId, pollId } = req.params;
  const isHost = checkIsHost(req, meetingId);

  if (!isHost) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only the meeting host can delete polls' },
    });
  }

  const db = DatabaseStore.getInstance();
  const success = db.deletePoll(pollId, req.user?.id || 'host_id');

  if (!success) {
    return res.status(404).json({
      success: false,
      error: { code: 'POLL_NOT_FOUND', message: 'Poll not found' },
    });
  }

  return res.json({
    success: true,
    message: 'Poll deleted successfully',
  });
});

// ==========================================
// 7. PATCH /api/meetings/:meetingId/polls/:pollId/visibility (Host only: Toggle Results Visibility)
// ==========================================
pollsRouter.patch('/:meetingId/polls/:pollId/visibility', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { meetingId, pollId } = req.params;
  const isHost = checkIsHost(req, meetingId);

  if (!isHost) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only the meeting host can change results visibility' },
    });
  }

  const { showResultsToParticipants } = req.body;
  const db = DatabaseStore.getInstance();
  const poll = db.togglePollResultsVisibility(pollId, req.user?.id || 'host_id', Boolean(showResultsToParticipants));

  if (!poll) {
    return res.status(404).json({
      success: false,
      error: { code: 'POLL_NOT_FOUND', message: 'Poll not found' },
    });
  }

  return res.json({
    success: true,
    data: poll,
    message: `Results are now ${poll.showResultsToParticipants ? 'visible' : 'hidden'} to participants`,
  });
});

// ==========================================
// 8. POST /api/meetings/:meetingId/polls/:pollId/respond (Participants & Host: Submit Response)
// ==========================================
pollsRouter.post('/:meetingId/polls/:pollId/respond', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { meetingId, pollId } = req.params;
  const { selectedOptionIds, participantName } = req.body as SubmitPollResponseRequest;

  if (!Array.isArray(selectedOptionIds) || selectedOptionIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Please select at least one option' },
    });
  }

  const participant = getParticipantIdentity(req);
  const name = participantName || participant.name;
  const db = DatabaseStore.getInstance();

  const result = db.recordPollResponse(pollId, participant.id, name, selectedOptionIds);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'RESPONSE_REJECTED', message: result.error || 'Failed to submit response' },
    });
  }

  const isHost = checkIsHost(req, meetingId);
  const pollResults = db.getPollResults(pollId, isHost);

  return res.json({
    success: true,
    data: {
      response: result.response,
      results: pollResults,
    },
    message: 'Poll response recorded successfully',
  });
});

// ==========================================
// 9. GET /api/meetings/:meetingId/polls/:pollId/results (View Results)
// ==========================================
pollsRouter.get('/:meetingId/polls/:pollId/results', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { meetingId, pollId } = req.params;
  const isHost = checkIsHost(req, meetingId);
  const db = DatabaseStore.getInstance();

  const results = db.getPollResults(pollId, isHost);

  if (!results) {
    return res.status(403).json({
      success: false,
      error: { code: 'RESULTS_HIDDEN', message: 'Poll results are not available or have been hidden by the host' },
    });
  }

  return res.json({
    success: true,
    data: results,
  });
});

// ==========================================
// 10. GET /api/meetings/:meetingId/polls/:pollId/export (Host only: Export Results)
// ==========================================
pollsRouter.get('/:meetingId/polls/:pollId/export', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { meetingId, pollId } = req.params;
  const format = (req.query.format as string) || 'json';
  const isHost = checkIsHost(req, meetingId);

  if (!isHost) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only the meeting host can export poll results' },
    });
  }

  const db = DatabaseStore.getInstance();
  const exportData = db.exportPollResults(pollId, req.user?.id || 'host_id');

  if (!exportData) {
    return res.status(404).json({
      success: false,
      error: { code: 'POLL_NOT_FOUND', message: 'Poll not found or no results to export' },
    });
  }

  if (format === 'csv') {
    // Generate CSV Content
    let csv = `Poll Question,"${exportData.question.replace(/"/g, '""')}"\n`;
    csv += `Type,${exportData.pollType === 'single' ? 'Single Choice' : 'Multiple Choice'}\n`;
    csv += `Anonymous,${exportData.isAnonymous ? 'Yes' : 'No'}\n`;
    csv += `Total Responses,${exportData.totalResponses}\n\n`;
    csv += `Option,Votes,Percentage\n`;
    exportData.optionsSummary.forEach((opt) => {
      csv += `"${opt.optionText.replace(/"/g, '""')}",${opt.votes},${opt.percentage}\n`;
    });

    if (exportData.detailedResponses && exportData.detailedResponses.length > 0) {
      csv += `\nParticipant Name,Selected Options,Submitted At\n`;
      exportData.detailedResponses.forEach((resp) => {
        csv += `"${resp.participantName.replace(/"/g, '""')}","${resp.selectedOptions.join('; ').replace(/"/g, '""')}",${resp.submittedAt}\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="poll-${pollId}-results.csv"`);
    return res.send(csv);
  }

  return res.json({
    success: true,
    data: exportData,
  });
});
