"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const taskService_1 = require("../services/taskService");
const router = (0, express_1.Router)();
exports.tasksRouter = router;
const createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    severity: zod_1.z.enum(['tiny', 'homework', 'project', 'midterm']).optional(),
    estimatedMinutes: zod_1.z.number().min(5).max(1440).optional(),
    dueDate: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.number()]).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(24)).max(24).optional(),
});
router.post('/', (0, auth_1.requireAuth)(['tasks.write']), async (req, res) => {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid task payload',
            details: parsed.error.flatten(),
        });
    }
    const payload = {
        ...parsed.data,
        dueDate: parsed.data.dueDate !== undefined
            ? new Date(parsed.data.dueDate)
            : undefined,
    };
    try {
        const task = await (0, taskService_1.createTask)(req.auth.userId, payload);
        return (0, response_1.success)(res, task, {}, 201);
    }
    catch (error) {
        console.error('Failed to create task', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'task_create_failed',
            message: 'Failed to create task',
        });
    }
});
const listQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).optional(),
});
router.get('/', (0, auth_1.requireAuth)(['tasks.read']), async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid query parameters',
            details: parsed.error.flatten(),
        });
    }
    try {
        const tasks = await (0, taskService_1.listTasks)(req.auth.userId, parsed.data);
        return (0, response_1.success)(res, { tasks, count: tasks.length });
    }
    catch (error) {
        console.error('Failed to list tasks', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'task_list_failed',
            message: 'Failed to fetch tasks',
        });
    }
});
const updateTaskSchema = createTaskSchema
    .extend({
    status: zod_1.z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
})
    .partial();
router.put('/:taskId', (0, auth_1.requireAuth)(['tasks.write']), async (req, res) => {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid task update payload',
            details: parsed.error.flatten(),
        });
    }
    const payload = {
        ...parsed.data,
        dueDate: parsed.data.dueDate !== undefined
            ? parsed.data.dueDate
                ? new Date(parsed.data.dueDate)
                : null
            : undefined,
    };
    try {
        const task = await (0, taskService_1.updateTask)(req.auth.userId, req.params.taskId, payload);
        return (0, response_1.success)(res, task);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: error?.status || 500,
            code: error?.code || 'task_update_failed',
            message: error?.message || 'Failed to update task',
        });
    }
});
const completionSchema = zod_1.z.object({
    completionFraction: zod_1.z.number().min(0).max(1).optional(),
    actualMinutes: zod_1.z.number().min(0).max(1440).optional(),
    notes: zod_1.z.string().max(2000).optional(),
});
router.post('/:taskId/complete', (0, auth_1.requireAuth)(['tasks.write']), async (req, res) => {
    const parsed = completionSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid completion payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const task = await (0, taskService_1.completeTask)(req.auth.userId, req.params.taskId, parsed.data);
        return (0, response_1.success)(res, task);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: error?.status || 500,
            code: error?.code || 'task_completion_failed',
            message: error?.message || 'Failed to complete task',
        });
    }
});
const splitSchema = zod_1.z.object({
    instructions: zod_1.z.string().max(2000).optional(),
});
router.post('/:taskId/split', (0, auth_1.requireAuth)(['tasks.write']), async (req, res) => {
    const parsed = splitSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid split request payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const job = await (0, taskService_1.enqueueTaskSplit)(req.auth.userId, req.params.taskId, parsed.data.instructions);
        return (0, response_1.success)(res, { requestId: job.requestId, status: 'queued' }, {}, 202);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: error?.status || 500,
            code: error?.code || 'task_split_failed',
            message: error?.message || 'Failed to queue split request',
        });
    }
});
router.get('/:taskId/subtasks', (0, auth_1.requireAuth)(['tasks.read']), async (req, res) => {
    try {
        const subtasks = await (0, taskService_1.listSubtasks)(req.auth.userId, req.params.taskId);
        return (0, response_1.success)(res, { subtasks, count: subtasks.length });
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'subtask_list_failed',
            message: 'Failed to fetch subtasks',
        });
    }
});
const calendarSchema = zod_1.z.object({
    blockIds: zod_1.z.array(zod_1.z.string().min(1)).max(50),
});
router.post('/calendar/acknowledge', (0, auth_1.requireAuth)(['tasks.write']), async (req, res) => {
    const parsed = calendarSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid calendar acknowledgment payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const updated = await (0, taskService_1.acknowledgeCalendarPlan)(req.auth.userId, parsed.data.blockIds);
        return (0, response_1.success)(res, { updated });
    }
    catch (error) {
        console.error('Failed to acknowledge calendar blocks', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'calendar_ack_failed',
            message: 'Failed to acknowledge calendar plan',
        });
    }
});
//# sourceMappingURL=tasks.js.map