import express, { Router } from "express";
import { prisma } from "@repo/db/client";
import { requireUser } from "../middleware";

export const workspaceRouter: Router = express.Router();

workspaceRouter.post("/", requireUser, async (req, res) => {
  try {
    const user = req.user;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Workspace name required" });
    }
    

    // 1. CREATE WORKSPACE
    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
      },
    });

    // 2. ADD CREATOR AS ADMIN
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,          // from Better Auth session
        workspaceId: workspace.id,
        role: "ADMIN",
      },
    });

    return res.json({
      workspace,
      message: "Workspace created successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});


workspaceRouter.post("/:workspaceId/invite", requireUser, async (req, res) => {
  try {
    const user = req.user;
    const { workspaceId } = req.params;
    const { role } = req.body;

    // check if user is ADMIN
    const member = await prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
        workspaceId: Number(workspaceId),
      },
    });

    if (!member || member.role !== "ADMIN") {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    // create invite
    const token = crypto.randomUUID();

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: Number(workspaceId),
        token,
        role,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      },
    });

    const inviteLink = `http://localhost:3000/invite/${token}`;

    return res.json({ inviteLink });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});


workspaceRouter.post("/join/:token", requireUser, async (req, res) => {
  try {
    const user = req.user;
    const { token } = req.params;

    // 🔴 1. token must exist
    if (!token) {
      return res.status(400).json({ error: "TOKEN_REQUIRED" });
    }

    // 🔴 2. find invite
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      return res.status(404).json({ error: "INVALID_INVITE" });
    }

    // 🔴 3. check expiry
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ error: "INVITE_EXPIRED" });
    }

    // 🔴 4. check already member
    const existing = await prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
        workspaceId: invite.workspaceId,
      },
    });

    if (existing) {
      return res.status(200).json({
        message: "Already a member",
        alreadyJoined: true,
      });
    }

    // 🔴 5. create membership
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: invite.workspaceId,
        role: invite.role,
      },
    });

    return res.status(200).json({
      message: "Joined successfully",
      success: true,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});


workspaceRouter.get("/:workspaceId/members", requireUser, async (req, res) => {
  const { workspaceId } = req.params;

  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId: Number(workspaceId),
    },
    include: {
      user: true,
    },
  });

  return res.json(members);
});

workspaceRouter.patch("/member/:id", requireUser, async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const { role } = req.body;

  // find member being updated
  const memberToUpdate = await prisma.workspaceMember.findUnique({
    where: { id: Number(id) },
  });

  if (!memberToUpdate) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  // check if current user is ADMIN
  const currentUser = await prisma.workspaceMember.findFirst({
    where: {
      userId: user.id,
      workspaceId: memberToUpdate.workspaceId,
    },
  });

  if (!currentUser || currentUser.role !== "ADMIN") {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  // update role
  const updated = await prisma.workspaceMember.update({
    where: { id: Number(id) },
    data: { role },
  });

  return res.json(updated);
});

workspaceRouter.get("/", requireUser, async (req, res) => {
  const user = req.user;

  const workspaces = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: true,
    },
  });

  return res.json(workspaces);
});
