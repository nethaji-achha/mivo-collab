import { Router, Response } from 'express';
import { DatabaseStore } from '../db';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  CreateProductRequest,
  CreateProductTeamRequest,
  AddProductMemberRequest,
  SendProductMessageRequest,
} from '@mivo/types';

export const productsRouter = Router();

// ==========================================
// 1. GET /api/products (List all products)
// ==========================================
productsRouter.get('/', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const orgId = (req.query.orgId as string) || undefined;
  const products = db.getProducts(orgId);

  return res.json({
    success: true,
    data: products,
    meta: {
      totalCount: products.length,
      timestamp: new Date().toISOString(),
    },
  });
});

// ==========================================
// 2. GET /api/products/:productId (Get Product details)
// ==========================================
productsRouter.get('/:productId', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const db = DatabaseStore.getInstance();
  const product = db.getProductById(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
    });
  }

  return res.json({
    success: true,
    data: product,
  });
});

// ==========================================
// 3. POST /api/products (Create New Product)
// ==========================================
productsRouter.post('/', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name, tagline, description, iconName, colorScheme, targetLaunchDate, initialTeams } =
    req.body as CreateProductRequest;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Product name is required' },
    });
  }

  const db = DatabaseStore.getInstance();
  const orgId = (req.body && req.body.organizationId) || 'org_demo_1';

  const product = db.createProduct({
    name,
    tagline: tagline || '',
    description: description || '',
    iconName: iconName || 'Layers',
    colorScheme: colorScheme || 'from-mivo-500 to-cyan-500',
    targetLaunchDate,
    initialTeams,
    organizationId: orgId,
  });

  return res.status(201).json({
    success: true,
    data: product,
    message: 'Product created successfully with 15-stage lifecycle timeline',
  });
});

// ==========================================
// 4. POST /api/products/:productId/stages/advance (Advance Stage Gate)
// ==========================================
productsRouter.post('/:productId/stages/advance', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const db = DatabaseStore.getInstance();
  const product = db.advanceProductStage(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
    });
  }

  return res.json({
    success: true,
    data: product,
    message: 'Stage advanced successfully',
  });
});

// ==========================================
// 5. POST /api/products/:productId/tasks/toggle (Toggle Task Completion)
// ==========================================
productsRouter.post('/:productId/tasks/toggle', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const { stageId, section, taskId } = req.body;

  if (!stageId || !section || !taskId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'stageId, section and taskId are required' },
    });
  }

  const db = DatabaseStore.getInstance();
  const product = db.toggleProductTask(productId, Number(stageId), section, taskId);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: { code: 'PRODUCT_NOT_FOUND', message: 'Product or stage not found' },
    });
  }

  return res.json({
    success: true,
    data: product,
  });
});

// ==========================================
// 6. POST /api/products/:productId/tasks (Add Task to Stage)
// ==========================================
productsRouter.post('/:productId/tasks', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const { stageId, section, text, assigneeName } = req.body;

  if (!stageId || !section || !text || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'stageId, section and text are required' },
    });
  }

  const db = DatabaseStore.getInstance();
  const product = db.addProductTask(productId, Number(stageId), section, text, assigneeName);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
    });
  }

  return res.json({
    success: true,
    data: product,
  });
});

// ==========================================
// 7. DELETE /api/products/:productId/stages/:stageId/tasks/:taskId
// ==========================================
productsRouter.delete(
  '/:productId/stages/:stageId/tasks/:taskId',
  optionalAuthMiddleware,
  (req: AuthenticatedRequest, res: Response) => {
    const { productId, stageId, taskId } = req.params;
    const section = (req.query.section as 'workDone' | 'workNext') || 'workNext';

    const db = DatabaseStore.getInstance();
    const product = db.deleteProductTask(productId, Number(stageId), section, taskId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  }
);

// ==========================================
// 8. GET /api/products/:productId/messages (Get Team Chat Feed)
// ==========================================
productsRouter.get('/:productId/messages', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const db = DatabaseStore.getInstance();
  const messages = db.getProductMessages(productId);

  return res.json({
    success: true,
    data: messages,
    meta: {
      totalCount: messages.length,
      timestamp: new Date().toISOString(),
    },
  });
});

// ==========================================
// 9. POST /api/products/:productId/messages (Send Team Message)
// ==========================================
productsRouter.post('/:productId/messages', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const { content, teamId, stageTag } = req.body as SendProductMessageRequest;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Message content cannot be empty' },
    });
  }

  const sender = req.user
    ? { id: req.user.id, name: req.user.name, avatar: req.user.avatarUrl }
    : {
        id: (req.headers['x-mivo-user-id'] as string) || 'usr_guest',
        name: (req.headers['x-mivo-display-name'] as string) || 'Team Member',
        avatar: undefined,
      };

  const db = DatabaseStore.getInstance();
  const newMessage = db.sendProductMessage(productId, {
    senderId: sender.id,
    senderName: sender.name,
    senderAvatar: sender.avatar,
    senderRole: req.user?.role || 'Team Member',
    content,
    teamId,
    stageTag,
  });

  return res.status(201).json({
    success: true,
    data: newMessage,
  });
});

// ==========================================
// 10. POST /api/products/:productId/members (Add Member to Product)
// ==========================================
productsRouter.post('/:productId/members', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const { name, email, role, title, assignedTeamId } = req.body as AddProductMemberRequest;

  if (!name || !email || !role || !title) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'name, email, role, and title are required' },
    });
  }

  const db = DatabaseStore.getInstance();
  const product = db.addProductMember(productId, {
    name,
    email,
    role,
    title,
    assignedTeamId,
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
    });
  }

  return res.status(201).json({
    success: true,
    data: product,
    message: 'Member added to product team successfully',
  });
});

// ==========================================
// 11. POST /api/products/:productId/teams (Create Squad in Product)
// ==========================================
productsRouter.post('/:productId/teams', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const { name, description, leadName, leadRole, currentSprint, color } = req.body as CreateProductTeamRequest;

  if (!name || !leadName || !leadRole) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'name, leadName, and leadRole are required' },
    });
  }

  const db = DatabaseStore.getInstance();
  const product = db.addProductTeam(productId, {
    name,
    description: description || '',
    leadName,
    leadRole,
    currentSprint,
    color,
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
    });
  }

  return res.status(201).json({
    success: true,
    data: product,
    message: 'Team squad created successfully in product',
  });
});
