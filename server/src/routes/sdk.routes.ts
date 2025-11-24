import { Router, Request, Response, NextFunction } from 'express';
import * as appService from '../services/appService';
import * as deviceService from '../services/deviceService';
import { validateRegisterDevice, validateUnregisterDevice } from '../utils/validation';
import { getVapidPublicKey } from '../utils/webPush';

const router = Router();

// Get VAPID public key (needed for client-side push subscription)
router.get('/vapid-public-key', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      publicKey: getVapidPublicKey(),
    },
  });
});

/**
 * @swagger
 * /sdk/register-device:
 *   post:
 *     summary: Register a device for push notifications
 *     tags: [SDK]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appId
 *               - publicKey
 *               - subscription
 *               - externalUserId
 *             properties:
 *               appId:
 *                 type: string
 *               publicKey:
 *                 type: string
 *               subscription:
 *                 type: object
 *               externalUserId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device registered successfully
 */
router.post('/register-device', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateRegisterDevice(req.body);

    // Validate SDK credentials (appId + publicKey)
    const app = await appService.validateSdkCredentials(data.appId, data.publicKey);

    // Register device
    const device = await deviceService.registerDevice(
      app.id,
      data.externalUserId,
      data.subscription
    );

    res.status(201).json({
      success: true,
      data: {
        deviceId: device.id,
        message: 'Device registered successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Unregister device
router.post('/unregister-device', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateUnregisterDevice(req.body);

    // Validate app exists
    const app = await appService.getAppByPublicId(data.appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found',
      });
    }

    // Unregister device
    await deviceService.unregisterDevice(app.id, data.externalUserId);

    return res.json({
      success: true,
      message: 'Device unregistered successfully',
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
