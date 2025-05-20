import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';

const router = Router();
const emailController = new EmailController();

// Gmail authentication routes
router.get('/auth/url', (req, res) => emailController.getAuthUrl(req, res));
router.get('/auth/callback', (req, res) => emailController.handleAuthCallback(req, res));

// User-specific routes
router.get('/:userId/threads', (req, res) => emailController.getRecentThreads(req, res));
router.get('/:userId/threads/summarize', (req, res) => emailController.summarizeThreads(req, res));
router.get('/:userId/threads/summaries', (req, res) => emailController.getThreadSummaries(req, res));
router.get('/:userId/process', (req, res) => emailController.processEmails(req, res));
router.get('/:userId/summaries', (req, res) => emailController.getSummaries(req, res));
router.get('/:userId/logout', (req, res) => emailController.logout(req, res));

// New routes
router.get('/:userId/summary', (req, res) => emailController.getAllSummaries(req, res));
router.post('/:userId/reply', (req, res) => emailController.sendReply(req, res));
router.get('/:userId/replies', (req, res) => emailController.getUserReplies(req, res));
router.get('/threads/:threadId/replies', (req, res) => emailController.getThreadReplies(req, res));

// Summary routes (these don't need userId as they use the summary ID)
router.get('/summaries/:id', (req, res) => emailController.getSummaryById(req, res));

export default router; 