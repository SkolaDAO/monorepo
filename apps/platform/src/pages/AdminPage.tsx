import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Container, Button, Card, CardContent, Badge, cn } from "@skola/ui";
import { useAuth } from "../contexts/AuthContext";
import { VerifiedBadge } from "../components/VerifiedBadge";
import {
  useAdminStats,
  useAdminUsers,
  useAdminCourses,
  useAdminReports,
  useAdminCreators,
  useAdminChannels,
  useAdminChannelMessages,
  useAdminActions,
  type AdminUser,
  type AdminCourse,
  type AdminReport,
  type AdminCreator,
  type AdminChannel,
} from "../hooks/useAdmin";

type Tab = "overview" | "users" | "courses" | "reports" | "creators" | "messages";

export function AdminPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (authLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="border-b border-border bg-muted/30">
        <Container>
          <div className="py-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <ShieldIcon className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage users, courses, and reports</p>
              </div>
            </div>
          </div>

          <div className="flex gap-1 -mb-px overflow-x-auto">
            {[
              { id: "overview" as Tab, label: "Overview", icon: ChartIcon },
              { id: "users" as Tab, label: "Users", icon: UsersIcon },
              { id: "creators" as Tab, label: "Creators", icon: StarIcon },
              { id: "courses" as Tab, label: "Courses", icon: BookIcon },
              { id: "messages" as Tab, label: "Messages", icon: MessageIcon },
              { id: "reports" as Tab, label: "Reports", icon: FlagIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-6">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "creators" && <CreatorsTab />}
          {activeTab === "courses" && <CoursesTab />}
          {activeTab === "messages" && <MessagesTab />}
          {activeTab === "reports" && <ReportsTab />}
        </div>
      </Container>
    </div>
  );
}

function OverviewTab() {
  const { stats, isLoading } = useAdminStats();

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading stats...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load stats</div>;
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: UsersIcon, color: "text-blue-500" },
    { label: "Creators", value: stats.totalCreators, icon: StarIcon, color: "text-amber-500" },
    { label: "Courses", value: stats.totalCourses, icon: BookIcon, color: "text-emerald-500" },
    { label: "Pending Reports", value: stats.pendingReports, icon: FlagIcon, color: "text-destructive" },
    { label: "Banned Users", value: stats.totalBannedUsers, icon: BanIcon, color: "text-orange-500" },
    { label: "Hidden Courses", value: stats.totalHiddenCourses, icon: EyeOffIcon, color: "text-purple-500" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={cn("p-3 rounded-full bg-muted", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UsersTab() {
  const [filter, setFilter] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useAdminUsers({ page, banned: filter });
  const { banUser, unbanUser, isLoading: actionLoading } = useAdminActions();
  const [actionModal, setActionModal] = useState<{ type: "ban" | "unban"; user: AdminUser } | null>(null);
  const [reason, setReason] = useState("");

  const handleAction = async () => {
    if (!actionModal) return;
    try {
      if (actionModal.type === "ban") {
        await banUser(actionModal.user.id, reason);
      } else {
        await unbanUser(actionModal.user.id);
      }
      setActionModal(null);
      setReason("");
      refetch();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as typeof filter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
        >
          <option value="all">All Users</option>
          <option value="false">Active Users</option>
          <option value="true">Banned Users</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading users...</div>
      ) : !data?.data.length ? (
        <div className="text-center py-12 text-muted-foreground">No users found</div>
      ) : (
        <>
          <div className="space-y-3">
            {data.data.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-sm font-medium">
                            {(user.username || user.address)[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {user.username || truncateAddress(user.address)}
                          </span>
                          {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
                          {user.isCreator && <Badge variant="outline">Creator</Badge>}
                          {user.isBanned && <Badge variant="destructive">Banned</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.address}</p>
                        {user.isBanned && user.bannedReason && (
                          <p className="text-xs text-destructive mt-1">Reason: {user.bannedReason}</p>
                        )}
                      </div>
                    </div>

                    {!user.isAdmin && (
                      <Button
                        variant={user.isBanned ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => setActionModal({ type: user.isBanned ? "unban" : "ban", user })}
                      >
                        {user.isBanned ? "Unban" : "Ban"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {actionModal && (
        <Modal
          title={actionModal.type === "ban" ? "Ban User" : "Unban User"}
          onClose={() => {
            setActionModal(null);
            setReason("");
          }}
          onConfirm={handleAction}
          isLoading={actionLoading}
          confirmLabel={actionModal.type === "ban" ? "Ban User" : "Unban User"}
          confirmVariant={actionModal.type === "ban" ? "destructive" : "default"}
        >
          {actionModal.type === "ban" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to ban{" "}
                <strong>{actionModal.user.username || truncateAddress(actionModal.user.address)}</strong>?
              </p>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter ban reason..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                  rows={3}
                  required
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Are you sure you want to unban{" "}
              <strong>{actionModal.user.username || truncateAddress(actionModal.user.address)}</strong>?
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}

function CoursesTab() {
  const [filter, setFilter] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useAdminCourses({ page, hidden: filter });
  const { hideCourse, unhideCourse, deleteCourse, isLoading: actionLoading } = useAdminActions();
  const [actionModal, setActionModal] = useState<{ type: "hide" | "unhide" | "delete"; course: AdminCourse } | null>(null);
  const [reason, setReason] = useState("");

  const handleAction = async () => {
    if (!actionModal) return;
    try {
      if (actionModal.type === "hide") {
        await hideCourse(actionModal.course.id, reason);
      } else if (actionModal.type === "unhide") {
        await unhideCourse(actionModal.course.id);
      } else if (actionModal.type === "delete") {
        await deleteCourse(actionModal.course.id);
      }
      setActionModal(null);
      setReason("");
      refetch();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as typeof filter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
        >
          <option value="all">All Courses</option>
          <option value="false">Visible Courses</option>
          <option value="true">Hidden Courses</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading courses...</div>
      ) : !data?.data.length ? (
        <div className="text-center py-12 text-muted-foreground">No courses found</div>
      ) : (
        <>
          <div className="space-y-3">
            {data.data.map((course) => (
              <Card key={course.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-24 rounded-lg bg-muted overflow-hidden shrink-0">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <BookIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{course.title}</span>
                          {course.isFree && <Badge className="bg-emerald-500">Free</Badge>}
                          {course.isHidden && <Badge variant="destructive">Hidden</Badge>}
                          {!course.isPublished && <Badge variant="secondary">Draft</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          by {course.creator.username || truncateAddress(course.creator.address)}
                        </p>
                        {course.isHidden && course.hiddenReason && (
                          <p className="text-xs text-destructive mt-1">Reason: {course.hiddenReason}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={course.isHidden ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => setActionModal({ type: course.isHidden ? "unhide" : "hide", course })}
                      >
                        {course.isHidden ? "Unhide" : "Hide"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setActionModal({ type: "delete", course })}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {actionModal && (
        <Modal
          title={
            actionModal.type === "hide"
              ? "Hide Course"
              : actionModal.type === "unhide"
              ? "Unhide Course"
              : "Delete Course"
          }
          onClose={() => {
            setActionModal(null);
            setReason("");
          }}
          onConfirm={handleAction}
          isLoading={actionLoading}
          confirmLabel={
            actionModal.type === "hide"
              ? "Hide Course"
              : actionModal.type === "unhide"
              ? "Unhide Course"
              : "Delete Course"
          }
          confirmVariant={actionModal.type === "unhide" ? "default" : "destructive"}
        >
          {actionModal.type === "hide" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to hide <strong>{actionModal.course.title}</strong>?
              </p>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for hiding..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                  rows={3}
                  required
                />
              </div>
            </div>
          ) : actionModal.type === "unhide" ? (
            <p className="text-sm text-muted-foreground">
              Are you sure you want to unhide <strong>{actionModal.course.title}</strong>?
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to <strong className="text-destructive">permanently delete</strong>{" "}
                <strong>{actionModal.course.title}</strong>?
              </p>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive">
                  <strong>Warning:</strong> This action cannot be undone. The course will be hidden
                  and marked as deleted. The creator will be notified.
                </p>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function ReportsTab() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "reviewed" | "resolved" | "dismissed" | "all">("pending");
  const [typeFilter, setTypeFilter] = useState<"course" | "user" | "message" | "all">("all");
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useAdminReports({ page, status: statusFilter, type: typeFilter });
  const { updateReportStatus, isLoading: actionLoading } = useAdminActions();
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const handleStatusUpdate = async (reportId: string, status: "reviewed" | "resolved" | "dismissed") => {
    try {
      await updateReportStatus(reportId, status, reviewNotes || undefined);
      setSelectedReport(null);
      setReviewNotes("");
      refetch();
    } catch {}
  };

  const getReportTarget = (report: AdminReport) => {
    if (report.reportType === "course" && report.targetCourse) {
      return { type: "Course", name: report.targetCourse.title };
    }
    if (report.reportType === "user" && report.targetUser) {
      return { type: "User", name: report.targetUser.username || truncateAddress(report.targetUser.address) };
    }
    if (report.reportType === "message" && report.targetMessage) {
      return { type: "Message", name: report.targetMessage.content.slice(0, 50) + "..." };
    }
    return { type: report.reportType, name: "Unknown" };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All Status</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as typeof typeFilter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
        >
          <option value="all">All Types</option>
          <option value="course">Course Reports</option>
          <option value="user">User Reports</option>
          <option value="message">Message Reports</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading reports...</div>
      ) : !data?.data.length ? (
        <div className="text-center py-12 text-muted-foreground">No reports found</div>
      ) : (
        <>
          <div className="space-y-3">
            {data.data.map((report) => {
              const target = getReportTarget(report);
              return (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{target.type}</Badge>
                          <Badge
                            variant={
                              report.status === "pending"
                                ? "destructive"
                                : report.status === "resolved"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {report.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium">{target.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Reason: <span className="text-foreground">{formatReason(report.reason)}</span>
                        </p>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Details: {report.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Reported by: {report.reporter.username || truncateAddress(report.reporter.address)}
                        </p>
                      </div>

                      {report.status === "pending" && (
                        <Button size="sm" onClick={() => setSelectedReport(report)}>
                          Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {data.pagination.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {selectedReport && (
        <Modal
          title="Review Report"
          onClose={() => {
            setSelectedReport(null);
            setReviewNotes("");
          }}
          showFooter={false}
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Report Details</p>
              <p className="text-sm text-muted-foreground">
                Type: {selectedReport.reportType} | Reason: {formatReason(selectedReport.reason)}
              </p>
              {selectedReport.description && (
                <p className="text-sm text-muted-foreground mt-1">{selectedReport.description}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Review Notes (optional)</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about this review..."
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={actionLoading}
                onClick={() => handleStatusUpdate(selectedReport.id, "dismissed")}
              >
                Dismiss
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={actionLoading}
                onClick={() => handleStatusUpdate(selectedReport.id, "reviewed")}
              >
                Mark Reviewed
              </Button>
              <Button
                className="flex-1"
                disabled={actionLoading}
                onClick={() => handleStatusUpdate(selectedReport.id, "resolved")}
              >
                Resolve
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CreatorsTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const { data, isLoading, refetch } = useAdminCreators({ page, search: search || undefined });
  const { whitelistCreator, removeCreator, verifyCreator, unverifyCreator, isLoading: actionLoading } = useAdminActions();
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [removeModal, setRemoveModal] = useState<AdminCreator | null>(null);

  const handleWhitelist = async () => {
    if (!whitelistAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return;
    }
    try {
      await whitelistCreator(whitelistAddress);
      setWhitelistAddress("");
      setShowWhitelistModal(false);
      refetch();
    } catch {}
  };

  const handleRemove = async () => {
    if (!removeModal) return;
    try {
      await removeCreator(removeModal.id);
      setRemoveModal(null);
      refetch();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by address or username..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
        <Button onClick={() => setShowWhitelistModal(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Whitelist Creator
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading creators...</div>
      ) : !data?.data.length ? (
        <div className="text-center py-12 text-muted-foreground">No creators found</div>
      ) : (
        <>
          <div className="space-y-3">
            {data.data.map((creator) => (
              <Card key={creator.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                        {creator.avatar ? (
                          <img src={creator.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-sm font-medium">
                            {(creator.username || creator.address)[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium flex items-center gap-1.5">
                            {creator.username || truncateAddress(creator.address)}
                            {creator.isVerified && <VerifiedBadge size="sm" />}
                          </span>
                          {creator.creatorTier && (
                            <Badge variant="secondary">{creator.creatorTier}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{creator.address}</p>
                        {creator.creatorStats && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {creator.creatorStats.coursesCount} courses · {creator.creatorStats.studentsCount} students
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={creator.isVerified ? "outline" : "default"}
                        size="sm"
                        onClick={async () => {
                          try {
                            if (creator.isVerified) {
                              await unverifyCreator(creator.id);
                            } else {
                              await verifyCreator(creator.id);
                            }
                            refetch();
                          } catch {}
                        }}
                        disabled={actionLoading}
                      >
                        {creator.isVerified ? "Unverify" : "✓ Verify"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRemoveModal(creator)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {showWhitelistModal && (
        <Modal
          title="Whitelist Creator"
          onClose={() => {
            setShowWhitelistModal(false);
            setWhitelistAddress("");
          }}
          onConfirm={handleWhitelist}
          isLoading={actionLoading}
          confirmLabel="Whitelist"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the wallet address to whitelist as a creator. This will allow them to create
              courses without paying the registration fee.
            </p>
            <div>
              <label className="text-sm font-medium">Wallet Address</label>
              <input
                type="text"
                value={whitelistAddress}
                onChange={(e) => setWhitelistAddress(e.target.value)}
                placeholder="0x..."
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
              />
              {whitelistAddress && !whitelistAddress.match(/^0x[a-fA-F0-9]{40}$/) && (
                <p className="text-xs text-destructive mt-1">Invalid Ethereum address</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                <strong>Note:</strong> You may also need to whitelist them on-chain using the
                CreatorRegistry contract's <code>whitelistCreator</code> function.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {removeModal && (
        <Modal
          title="Remove Creator"
          onClose={() => setRemoveModal(null)}
          onConfirm={handleRemove}
          isLoading={actionLoading}
          confirmLabel="Remove Creator"
          confirmVariant="destructive"
        >
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove creator status from{" "}
            <strong>{removeModal.username || truncateAddress(removeModal.address)}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}

function MessagesTab() {
  const [filter, setFilter] = useState<"all" | "dm" | "community">("all");
  const [page, setPage] = useState(1);
  const [selectedChannel, setSelectedChannel] = useState<AdminChannel | null>(null);
  const { data, isLoading } = useAdminChannels({ page, type: filter });

  return (
    <div className="space-y-6">
      {!selectedChannel ? (
        <>
          <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as typeof filter);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              <option value="all">All Channels</option>
              <option value="community">Course Channels</option>
              <option value="dm">Direct Messages</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading channels...</div>
          ) : !data?.data.length ? (
            <div className="text-center py-12 text-muted-foreground">No channels found</div>
          ) : (
            <>
              <div className="space-y-3">
                {data.data.map((channel) => (
                  <Card
                    key={channel.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedChannel(channel)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {channel.type === "community" ? (
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <BookIcon className="h-5 w-5 text-primary" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <MessageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {channel.type === "community"
                                  ? channel.course?.title || "Unknown Course"
                                  : `${channel.participantOneUser?.username || truncateAddress(channel.participantOneUser?.address)} ↔ ${channel.participantTwoUser?.username || truncateAddress(channel.participantTwoUser?.address)}`}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {channel.type === "community" ? "Course" : "DM"}
                              </Badge>
                            </div>
                            {channel.lastMessage && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {channel.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{channel.messageCount} msgs</Badge>
                          {channel.lastMessageAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(channel.lastMessageAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {data.pagination.totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={data.pagination.totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </>
      ) : (
        <ChannelMessages channel={selectedChannel} onBack={() => setSelectedChannel(null)} />
      )}
    </div>
  );
}

function ChannelMessages({
  channel,
  onBack,
}: {
  channel: AdminChannel;
  onBack: () => void;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useAdminChannelMessages({ channelId: channel.id, page });
  const { deleteMessage, isLoading: actionLoading } = useAdminActions();
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteMessage(deleteModal);
      setDeleteModal(null);
      refetch();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Back to Channels
        </Button>
        <div>
          <h3 className="font-medium">
            {channel.type === "community"
              ? channel.course?.title
              : `DM: ${channel.participantOneUser?.username || truncateAddress(channel.participantOneUser?.address)} ↔ ${channel.participantTwoUser?.username || truncateAddress(channel.participantTwoUser?.address)}`}
          </h3>
          <p className="text-xs text-muted-foreground">{channel.messageCount} messages</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading messages...</div>
      ) : !data?.data.length ? (
        <div className="text-center py-12 text-muted-foreground">No messages in this channel</div>
      ) : (
        <>
          <div className="space-y-3">
            {data.data.map((message) => (
              <Card key={message.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-muted overflow-hidden shrink-0">
                        {message.sender.avatar ? (
                          <img src={message.sender.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs font-medium">
                            {(message.sender.username || message.sender.address)[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {message.sender.username || truncateAddress(message.sender.address)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1 break-words">{message.content}</p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => setDeleteModal(message.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {deleteModal && (
        <Modal
          title="Delete Message"
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
          isLoading={actionLoading}
          confirmLabel="Delete"
          confirmVariant="destructive"
        >
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this message? This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
  confirmLabel?: string;
  confirmVariant?: "default" | "destructive";
  showFooter?: boolean;
}

function Modal({
  title,
  children,
  onClose,
  onConfirm,
  isLoading,
  confirmLabel = "Confirm",
  confirmVariant = "default",
  showFooter = true,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-background border border-border rounded-2xl shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted transition-colors">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {showFooter && (
          <div className="flex gap-3 border-t border-border px-6 py-4">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant={confirmVariant}
              className="flex-1"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="py-8">
      <Container>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Container>
    </div>
  );
}

function truncateAddress(address?: string): string {
  if (!address) return "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatReason(reason: string): string {
  return reason.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function BanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
