import { Router, Request, Response, NextFunction } from 'express';
import * as appService from '../services/appService';
import * as userService from '../services/userService';
import { validateCreateApp, validateUpdateApp } from '../utils/validation';
import { authMiddleware } from '../middleware/auth';
import { requireApproved } from '../middleware/roleCheck';

/**
 * @swagger
 * tags:
 *   name: Apps
 *   description: Application management endpoints
 */

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /apps:
 *   get:
 *     summary: Get user's apps
 *     tags: [Apps]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's apps
 */
router.get('/', requireApproved, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apps = await appService.getUserApps(req.user!.userId, req.user!.role);

    res.json({
      success: true,
      data: apps,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /apps:
 *   post:
 *     summary: Create a new app
 *     tags: [Apps]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: App created successfully
 */
router.post('/', requireApproved, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateCreateApp(req.body);
    const app = await appService.createApp(req.user!.userId, data);

    res.status(201).json({
      success: true,
      data: app,
    });
  } catch (error) {
    next(error);
  }
});

// Get app by ID
router.get('/:id', requireApproved, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const app = await appService.getAppById(appId, req.user!.userId, req.user!.role);

    res.json({
      success: true,
      data: app,
    });
  } catch (error) {
    next(error);
  }
});

// Update app
router.patch('/:id', requireApproved, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const data = validateUpdateApp(req.body);
    const app = await appService.updateApp(appId, req.user!.userId, req.user!.role, data);

    res.json({
      success: true,
      data: app,
    });
  } catch (error) {
    next(error);
  }
});

// Rotate app secret
router.post('/:id/rotate-secret', requireApproved, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appId = parseInt(req.params.id, 10);
    const app = await appService.rotateAppSecret(appId, req.user!.userId, req.user!.role);

    res.json({
      success: true,
      data: app,
    });
  } catch (error) {
    next(error);
  }
});

// Delete app (soft delete)
router.delete('/:id', requireApproved, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appId = parseInt(req.params.id, 10);
    await appService.deleteApp(appId, req.user!.userId, req.user!.role);

    res.json({
      success: true,
      message: 'App deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get user warnings (for settings page)
router.get('/user/warnings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warnings = await userService.getUserWarnings(req.user!.userId);

    res.json({
      success: true,
      data: warnings,
    });
  } catch (error) {
    next(error);
  }
});

// Get system app public credentials (for notifications when user has no apps)
router.get('/system/public', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { getOrCreateInternalApp } = require('../services/internalNotificationService');
    const app = await getOrCreateInternalApp();

    res.json({
      success: true,
      data: {
        public_app_id: app.public_app_id,
        public_key: app.public_key || '', // Ensure public_key is returned
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
