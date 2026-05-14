import express, { Router } from "express";
import { requireUser } from "../middleware";
import { prisma } from "@repo/db/client";
import { getIO } from "../socket";

export const taskRouter: Router = express.Router();

taskRouter.post("/", requireUser, async (req, res) => {
  try {
    const user = req.user;
    const { title, description, workspaceId, assigneeIds } = req.body;

    if (!title || !workspaceId) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
        workspaceId: workspaceId,
      },
    });

    if (!member || (member.role !== "ADMIN" && member.role !== "MANAGER")) {
      return res.status(403).json({ error: "ONLY_MANAGER_OR_ADMIN_CAN_CREATE" });
    }

    const validMembers = await prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        userId: { in: assigneeIds || [] },
      },
    });

    if (validMembers.length !== (assigneeIds?.length || 0)) {
      return res.status(400).json({ error: "INVALID_ASSIGNEES" });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        workspaceId,
        createdById: user.id,
        assignees: {
          create: (assigneeIds || []).map((id: string) => ({
            userId: id,
          })),
        },
      },
      include: {
        assignees: { include: { user: true } },
        comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
      },
    });

    getIO().to(`workspace:${workspaceId}`).emit("task:created", {
      workspaceId,
      taskId: task.id,
    });

    return res.json(task);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});


taskRouter.get("/:workspaceId", requireUser, async (req, res) => {
  const user = req.user;
  const { workspaceId } = req.params;

  const member = await prisma.workspaceMember.findFirst({
    where: {
      userId: user.id,
      workspaceId: Number(workspaceId),
    },
  });

  if (!member) {
    return res.status(403).json({ error: "NOT_MEMBER" });
  }

  if (member.role === "ADMIN" || member.role === "MANAGER") {
    const tasks = await prisma.task.findMany({
      where: { workspaceId: Number(workspaceId) },
      include: {
        assignees: { include: { user: true } },
        comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(tasks);
  }

  const tasks = await prisma.task.findMany({
    where: {
      workspaceId: Number(workspaceId),
      assignees: {
        some: { userId: user.id },
      },
    },
    include: {
      assignees: { include: { user: true } },
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(tasks);
});

taskRouter.patch("/:taskId/status", requireUser, async (req, res) => {
  const user = req.user;
  const { taskId } = req.params;
  const { status } = req.body;

  const task = await prisma.task.findUnique({
    where: { id: Number(taskId) },
    include: { assignees: true },
  });

  if (!task) return res.status(404).json({ error: "NOT_FOUND" });

  // check role
  const member = await prisma.workspaceMember.findFirst({
    where: {
      userId: user.id,
      workspaceId: task.workspaceId,
    },
  });

  if (!member || member.role !== "EMPLOYEE") {
    return res.status(403).json({ error: "ONLY_EMPLOYEE_CAN_UPDATE" });
  }

  // check assignment
  const isAssigned = task.assignees.some((a: { userId: string }) => a.userId === user.id);

  if (!isAssigned) {
    return res.status(403).json({ error: "NOT_ASSIGNED" });
  }

  const now = new Date();
  const assignee = await prisma.taskAssignee.findFirst({
    where: {
      taskId: task.id,
      userId: user.id,
    },
  });

  if (!assignee) {
    return res.status(403).json({ error: "NOT_ASSIGNED" });
  }

  const updateAssigneeData: {
    startedAt?: Date;
    completedAt?: Date | null;
    timeSpentSeconds?: number | null;
  } = {};

  if (status === "IN_PROGRESS" && !assignee.startedAt) {
    updateAssigneeData.startedAt = now;
  }

  if (status === "DONE") {
    const startAt = assignee.startedAt ?? task.createdAt;
    updateAssigneeData.completedAt = now;
    updateAssigneeData.timeSpentSeconds = Math.max(
      0,
      Math.floor((now.getTime() - startAt.getTime()) / 1000)
    );
  } else if (status === "TODO" || status === "IN_PROGRESS") {
    updateAssigneeData.completedAt = null;
    updateAssigneeData.timeSpentSeconds = null;
  }

  await prisma.taskAssignee.update({
    where: { id: assignee.id },
    data: updateAssigneeData,
  });

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status },
    include: {
      assignees: { include: { user: true } },
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });

  getIO().to(`workspace:${task.workspaceId}`).emit("task:updated", {
    workspaceId: task.workspaceId,
    taskId: task.id,
    status: updated.status,
  });

  return res.json(updated);
});

taskRouter.post("/:taskId/comment", requireUser, async (req, res) => {
  const user = req.user;
  const { taskId } = req.params;
  const { content } = req.body;

  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: "COMMENT_REQUIRED" });
  }

  const task = await prisma.task.findUnique({
    where: { id: Number(taskId) },
  });

  if (!task) return res.status(404).json({ error: "NOT_FOUND" });

  const member = await prisma.workspaceMember.findFirst({
    where: {
      userId: user.id,
      workspaceId: task.workspaceId,
    },
  });

  if (!member || (member.role !== "ADMIN" && member.role !== "MANAGER")) {
    return res.status(403).json({ error: "ONLY_ADMIN_OR_MANAGER_CAN_COMMENT" });
  }

  const comment = await prisma.taskComment.create({
    data: {
      taskId: task.id,
      authorId: user.id,
      content: String(content).trim(),
    },
    include: {
      author: true,
    },
  });

  getIO().to(`workspace:${task.workspaceId}`).emit("task:comment_added", {
    workspaceId: task.workspaceId,
    taskId: task.id,
    commentId: comment.id,
  });

  return res.json(comment);
});