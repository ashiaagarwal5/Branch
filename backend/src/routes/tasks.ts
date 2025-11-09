import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { apiError, success } from '../utils/response';
import {
  acknowledgeCalendarPlan,
  completeTask,
  createTask,
  enqueueTaskSplit,
  listSubtasks,
  listTasks,
  updateTask,
} from '../services/taskService';

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  severity: z.enum(['tiny', 'homework', 'project', 'midterm']).optional(),
  estimatedMinutes: z.number().min(5).max(1440).optional(),
  dueDate: z.union([z.string().datetime(), z.number()]).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string().max(24)).max(24).optional(),
});

router.post('/', requireAuth(['tasks.write']), async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid task payload',
      details: parsed.error.flatten(),
    });
  }

  const payload = {
    ...parsed.data,
    dueDate:
      parsed.data.dueDate !== undefined
        ? new Date(parsed.data.dueDate)
        : undefined,
  };

  try {
    const task = await createTask(req.auth!.userId, payload);
    return success(res, task, {}, 201);
  } catch (error: any) {
    console.error('Failed to create task', error);
    return apiError(res, {
      status: 500,
      code: 'task_create_failed',
      message: 'Failed to create task',
    });
  }
});

const listQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

router.get('/', requireAuth(['tasks.read']), async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid query parameters',
      details: parsed.error.flatten(),
    });
  }

  try {
    const tasks = await listTasks(req.auth!.userId, parsed.data);
    return success(res, { tasks, count: tasks.length });
  } catch (error: any) {
    console.error('Failed to list tasks', error);
    return apiError(res, {
      status: 500,
      code: 'task_list_failed',
      message: 'Failed to fetch tasks',
    });
  }
});

const updateTaskSchema = createTaskSchema
  .extend({
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  })
  .partial();

router.put('/:taskId', requireAuth(['tasks.write']), async (req, res) => {
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid task update payload',
      details: parsed.error.flatten(),
    });
  }

  const payload = {
    ...parsed.data,
    dueDate:
      parsed.data.dueDate !== undefined
        ? parsed.data.dueDate
          ? new Date(parsed.data.dueDate)
          : null
        : undefined,
  };

  try {
    const task = await updateTask(req.auth!.userId, req.params.taskId, payload);
    return success(res, task);
  } catch (error: any) {
    return apiError(res, {
      status: error?.status || 500,
      code: error?.code || 'task_update_failed',
      message: error?.message || 'Failed to update task',
    });
  }
});

const completionSchema = z.object({
  completionFraction: z.number().min(0).max(1).optional(),
  actualMinutes: z.number().min(0).max(1440).optional(),
  notes: z.string().max(2000).optional(),
});

router.post(
  '/:taskId/complete',
  requireAuth(['tasks.write']),
  async (req, res) => {
    const parsed = completionSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, {
        status: 400,
        code: 'invalid_request',
        message: 'Invalid completion payload',
        details: parsed.error.flatten(),
      });
    }

    try {
      const task = await completeTask(
        req.auth!.userId,
        req.params.taskId,
        parsed.data
      );
      return success(res, task);
    } catch (error: any) {
      return apiError(res, {
        status: error?.status || 500,
        code: error?.code || 'task_completion_failed',
        message: error?.message || 'Failed to complete task',
      });
    }
  }
);

const splitSchema = z.object({
  instructions: z.string().max(2000).optional(),
});

router.post(
  '/:taskId/split',
  requireAuth(['tasks.write']),
  async (req, res) => {
    const parsed = splitSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, {
        status: 400,
        code: 'invalid_request',
        message: 'Invalid split request payload',
        details: parsed.error.flatten(),
      });
    }

    try {
      const job = await enqueueTaskSplit(
        req.auth!.userId,
        req.params.taskId,
        parsed.data.instructions
      );
      return success(
        res,
        { requestId: job.requestId, status: 'queued' },
        {},
        202
      );
    } catch (error: any) {
      return apiError(res, {
        status: error?.status || 500,
        code: error?.code || 'task_split_failed',
        message: error?.message || 'Failed to queue split request',
      });
    }
  }
);

router.get(
  '/:taskId/subtasks',
  requireAuth(['tasks.read']),
  async (req, res) => {
    try {
      const subtasks = await listSubtasks(req.auth!.userId, req.params.taskId);
      return success(res, { subtasks, count: subtasks.length });
    } catch (error: any) {
      return apiError(res, {
        status: 500,
        code: 'subtask_list_failed',
        message: 'Failed to fetch subtasks',
      });
    }
  }
);

const calendarSchema = z.object({
  blockIds: z.array(z.string().min(1)).max(50),
});

router.post(
  '/calendar/acknowledge',
  requireAuth(['tasks.write']),
  async (req, res) => {
    const parsed = calendarSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, {
        status: 400,
        code: 'invalid_request',
        message: 'Invalid calendar acknowledgment payload',
        details: parsed.error.flatten(),
      });
    }

    try {
      const updated = await acknowledgeCalendarPlan(
        req.auth!.userId,
        parsed.data.blockIds
      );
      return success(res, { updated });
    } catch (error: any) {
      console.error('Failed to acknowledge calendar blocks', error);
      return apiError(res, {
        status: 500,
        code: 'calendar_ack_failed',
        message: 'Failed to acknowledge calendar plan',
      });
    }
  }
);

export { router as tasksRouter };
