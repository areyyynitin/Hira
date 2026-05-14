"use client";

import { useCallback, useEffect, useState } from "react";
import WorkspaceSwitcher from "@/src/components/WorkspaceSwitcher";
import Members from "@/src/components/Members";
import CreateTask from "@/src/components/CreateTask";
import TaskList from "@/src/components/TaskList";
import DashboardOverview from "@/src/components/DashboardOverview";
import { useSession } from "@/src/lib/auth-client";
import CreateWorkspace from "@/src/components/Workspace";
import { socket } from "@/src/lib/socket";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/src/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Spinner } from "@/src/components/ui/spinner";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  PlusSquare,
  FolderPlus
} from "lucide-react";

export default function DashboardPage() {
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [role, setRole] = useState<string | null>(null);
  const [workspaceCount, setWorkspaceCount] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [activeView, setActiveView] = useState<"dashboard" | "kanban" | "members" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [inviteLink, setInviteLink] = useState("");
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const { data: session } = useSession();
  const hasWorkspaces = workspaceCount > 0;

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    socket.emit("user:join", userId);
    return () => {
      socket.emit("user:leave", userId);
    };
  }, [session?.user?.id]);

  const handleWorkspaceSelect = useCallback((id: number, selectedRole: string, selectedWorkspaceName: string) => {
    setWorkspaceId(id);
    setWorkspaceName(selectedWorkspaceName);
    setRole(selectedRole);
    setActiveView("dashboard");
    setInviteLink("");
    setInviteError("");
  }, []);
  const handleWorkspacesLoaded = useCallback((count: number) => {
    setWorkspaceCount(count);
    if (count === 0) {
      setWorkspaceId(null);
      setWorkspaceName("");
      setRole(null);
      setActiveView(null);
    }
  }, []);

  const canShareInvite = !!workspaceId && (role === "ADMIN" || role === "MANAGER");

  const generateInviteLink = async () => {
    if (!workspaceId) return;
    try {
      setIsGeneratingInvite(true);
      setInviteError("");
      const res = await fetch(`http://localhost:3001/workspace/${workspaceId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: "EMPLOYEE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to generate invite link");
        return;
      }
      setInviteLink(data.inviteLink || "");
    } catch {
      setInviteError("Network error while generating invite link");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
  };

  return (
    <>
      <Sidebar className="border-r border-[var(--primary)]/20 bg-[#181510]" collapsible="icon">
        <SidebarHeader className="group">
          <div className="px-2 py-1 flex items-center justify-center">
            {/* Optional: add icon/logo here */}
            <h2 className="text-lg font-semibold truncate group-data-[collapsible=icon]:hidden">
              {workspaceName || "Select Workspace"}
            </h2>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
            <SidebarGroupContent>
              <WorkspaceSwitcher
                onSelect={handleWorkspaceSelect}
                selectedWorkspaceId={workspaceId}
                refreshKey={refreshKey}
                onLoaded={handleWorkspacesLoaded}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "dashboard"}
                    onClick={() => setActiveView("dashboard")}
                  >
                    <LayoutDashboard className="size-4 shrink-0" />
                    <span className="truncate">Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "kanban"}
                    onClick={() => setActiveView("kanban")}
                  >
                    <KanbanSquare className="size-4 shrink-0" />
                    <span className="truncate">Kanban Board</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "members"}
                    onClick={() => setActiveView("members")}
                  >
                    <Users className="size-4 shrink-0" />
                    <span className="truncate">Members</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {role !== "EMPLOYEE" && workspaceId && (
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setShowAssignDialog(true)}>
                      <PlusSquare className="size-4 shrink-0" />
                      <span className="truncate">Assign Task</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setShowCreateDialog(true)}>
                    <FolderPlus className="size-4 shrink-0" />
                    <span className="truncate">
                      {hasWorkspaces ? "New Workspace" : "Create Workspace"}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>

        <SidebarFooter className="group">
  <div className="px-2 py-2 flex items-center gap-2">
    
    {/* Optional avatar circle */}
    <div className="size-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-xs">
      {session?.user?.name?.[0] ?? "U"}
    </div>

    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
      <p className="text-xs text-[var(--primary)]/80">
        {session?.user?.name ?? "User"}
      </p>
      <p className="text-[var(--accent)] text-xs">
        {role ?? "No Role"}
      </p>
    </div>

  </div>
</SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <main className="p-4 lg:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-[var(--text)]" />
              <h1 className="text-2xl font-bold">{workspaceName || "Dashboard"}</h1>
            </div>
            {role === "EMPLOYEE" && activeView === "kanban" && (
              <p className="text-sm text-[var(--primary)]">Drag your cards across columns to update status.</p>
            )}
          </div>

          {!workspaceId ? (
            <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-6 text-center">
              Select a workspace first.
            </div>
          ) : activeView === "dashboard" ? (
            <DashboardOverview workspaceId={workspaceId} workspaceName={workspaceName} />
          ) : activeView === "kanban" ? (
            <TaskList workspaceId={workspaceId} role={role!} />
          ) : activeView === "members" ? (
            <Members workspaceId={workspaceId} role={role ?? "EMPLOYEE"} />
          ) : (
            <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-6 text-center">
              Choose <span className="text-[var(--accent)]">Kanban Board</span> or{" "}
              <span className="text-[var(--accent)]">Members</span> from the sidebar actions.
            </div>
          )}
        </main>
      </SidebarInset>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#1e1b15] border border-[var(--primary)]/30 text-[var(--text)]">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription className="text-[var(--primary)]/80">
              Set up a new workspace and invite your team.
            </DialogDescription>
          </DialogHeader>
          <CreateWorkspace
            onCreated={(id: number, createdRole: string) => {
              setWorkspaceId(id);
              setWorkspaceName("New Workspace");
              setRole(createdRole);
              setRefreshKey((prev) => prev + 1);
              setShowCreateDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1e1b15] border border-[var(--primary)]/30 text-[var(--text)]">
          <DialogHeader>
            <DialogTitle>Assign Task & Share Invite</DialogTitle>
            <DialogDescription className="text-(--primary)/80">
              Assign work and optionally generate an invite link.
            </DialogDescription>
          </DialogHeader>

          {workspaceId && <CreateTask workspaceId={workspaceId} />}

          {canShareInvite && (
            <div className="rounded-lg border border-[var(--primary)]/20 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-[var(--primary)]">Share Invite Link</h3>
                <button
                  onClick={generateInviteLink}
                  disabled={isGeneratingInvite}
                  className="rounded bg-[var(--accent)] px-3 py-1 text-sm text-[#14120d] disabled:opacity-70 inline-flex items-center gap-2"
                >
                  {isGeneratingInvite ? (
                    <>
                      <Spinner className="size-3" />
                      Generating...
                    </>
                  ) : (
                    "Generate Link"
                  )}
                </button>
              </div>

              {inviteError && <p className="text-sm text-red-400">{inviteError}</p>}

              {inviteLink && (
                <div className="flex gap-2">
                  <input
                    value={inviteLink}
                    readOnly
                    className="w-full rounded border border-[var(--primary)]/30 bg-transparent px-3 py-2 text-sm"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="rounded border border-(--primary)/30 px-3 py-2 text-sm"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}