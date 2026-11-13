import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Building2,
  Users,
  TrendingDown,
  Search,
  AlertCircle,
  RefreshCw,
  Award,
  Plus,
  UserPlus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Globe,
  X,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  Briefcase,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import UserAvatar from "../components/UserAvatar";
import { apiRequest } from "../api";

const ORG_CHART_COLORS = ["#8D9B72", "#5C8CA6", "#D99B4B", "#8774A3", "#789968", "#64748B"];

export default function Organisation({ token }) {
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  // Tabs: 'overview' | 'members' | 'departments' | 'invitations' | 'analytics' | 'settings'
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  // Search, Filter & Pagination for Members
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("emissions");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  const [changeDeptModalOpen, setChangeDeptModalOpen] = useState(false);
  const [targetMemberForDept, setTargetMemberForDept] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);

  // Form states - Invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteDept, setInviteDept] = useState("Engineering");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Form states - Add Department
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptMemberId, setNewDeptMemberId] = useState("");
  const [deptLoading, setDeptLoading] = useState(false);

  // Form states - Settings / Edit Org
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("COMPANY");
  const [editDescription, setEditDescription] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Form states - Create Org
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState("COMPANY");
  const [createDescription, setCreateDescription] = useState("");
  const [createWebsite, setCreateWebsite] = useState("");
  const [createContactEmail, setCreateContactEmail] = useState("");
  const [createLogoUrl, setCreateLogoUrl] = useState("");
  const [createDept, setCreateDept] = useState("Management");
  const [createLoading, setCreateLoading] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const loadOrg = useCallback(async (targetOrgId = null) => {
    setLoading(true);
    setError("");
    try {
      const url = targetOrgId ? `/api/organizations/my?orgId=${targetOrgId}` : "/api/organizations/my";
      const res = await apiRequest(url, { token });
      setOrgData(res);
      if (res && res.hasOrganization) {
        setEditName(res.name || "");
        setEditType(res.type || "COMPANY");
        setEditDescription(res.description || "");
        setEditWebsite(res.website || "");
        setEditContactEmail(res.contactEmail || "");
        setEditLogoUrl(res.logoUrl || "");
      }
    } catch (err) {
      setError(err.message || "Unable to load organization workspace.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const timer = setTimeout(() => {
      loadOrg();
    }, 0);
    return () => clearTimeout(timer);
  }, [token, loadOrg]);

  const userRole = orgData?.userRole || "MEMBER";
  const isAdminOrOwner = userRole === "OWNER" || userRole === "ADMIN";
  const isOwner = userRole === "OWNER";

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    const list = orgData?.members || [];
    return list
      .filter((m) => {
        const matchesSearch =
          `${m.name} ${m.email} ${m.department}`.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "ALL" || m.role === roleFilter;
        const matchesDept = deptFilter === "ALL" || m.department === deptFilter;
        return matchesSearch && matchesRole && matchesDept;
      })
      .sort((a, b) => {
        if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
        if (sortBy === "activities") return (b.activitiesCount || 0) - (a.activitiesCount || 0);
        return Number(a.emissions || 0) - Number(b.emissions || 0);
      });
  }, [orgData, search, roleFilter, deptFilter, sortBy]);

  // Extract distinct departments for filter dropdown
  const allDepartments = useMemo(() => {
    const set = new Set();
    (orgData?.departments || []).forEach((d) => set.add(d.name));
    (orgData?.members || []).forEach((m) => {
      if (m.department) set.add(m.department);
    });
    return Array.from(set);
  }, [orgData]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMembers = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, safePage]);

  // --- ACTIONS ---

  // Invite Member (Organization-specific)
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!orgData?.organizationId) return;

    setInviteLoading(true);
    try {
      const res = await apiRequest(`/api/organizations/${orgData.organizationId}/members`, {
        method: "POST",
        token,
        body: {
          email: inviteEmail.trim(),
          role: inviteRole,
          department: inviteDept,
        },
      });

      showToast(res.message || "Team member invited successfully!");
      setInviteModalOpen(false);
      setInviteEmail("");
      loadOrg(orgData.organizationId);
    } catch (err) {
      showToast(err.message || "Failed to invite member", "error");
    } finally {
      setInviteLoading(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async () => {
    if (!orgData?.organizationId || !memberToRemove) return;

    try {
      await apiRequest(`/api/organizations/${orgData.organizationId}/members/${memberToRemove.userId}`, {
        method: "DELETE",
        token,
      });

      showToast(`${memberToRemove.name} was removed from the organization.`);
      setMemberToRemove(null);
      loadOrg(orgData.organizationId);
    } catch (err) {
      showToast(err.message || "Failed to remove member", "error");
    }
  };

  // Update Member Role
  const handleUpdateRole = async (targetUserId, newRole) => {
    if (!orgData?.organizationId) return;

    try {
      await apiRequest(`/api/organizations/${orgData.organizationId}/members/${targetUserId}/role`, {
        method: "PUT",
        token,
        body: { role: newRole },
      });

      showToast("Member role updated successfully.");
      loadOrg(orgData.organizationId);
    } catch (err) {
      showToast(err.message || "Failed to update role", "error");
    }
  };

  // Update Member Department
  const handleUpdateDept = async (targetUserId, newDept) => {
    if (!orgData?.organizationId) return;

    try {
      await apiRequest(`/api/organizations/${orgData.organizationId}/members/${targetUserId}/department`, {
        method: "PUT",
        token,
        body: { department: newDept },
      });

      showToast("Member department updated successfully.");
      setChangeDeptModalOpen(false);
      setTargetMemberForDept(null);
      loadOrg(orgData.organizationId);
    } catch (err) {
      showToast(err.message || "Failed to update department", "error");
    }
  };

  // Add Department / Assign member
  const handleAddDepartmentSubmit = async (e) => {
    e.preventDefault();
    if (!orgData?.organizationId || !newDeptName.trim()) return;

    setDeptLoading(true);
    try {
      if (newDeptMemberId) {
        await apiRequest(`/api/organizations/${orgData.organizationId}/members/${newDeptMemberId}/department`, {
          method: "PUT",
          token,
          body: { department: newDeptName.trim() },
        });
      }
      showToast(`Department "${newDeptName.trim()}" configured successfully!`);
      setAddDeptModalOpen(false);
      setNewDeptName("");
      setNewDeptMemberId("");
      loadOrg(orgData.organizationId);
    } catch (err) {
      showToast(err.message || "Failed to create department", "error");
    } finally {
      setDeptLoading(false);
    }
  };

  // Edit Organization Settings
  const handleEditOrgSubmit = async (e) => {
    e.preventDefault();
    if (!orgData?.organizationId) return;

    setEditLoading(true);
    try {
      await apiRequest(`/api/organizations/${orgData.organizationId}`, {
        method: "PUT",
        token,
        body: {
          name: editName.trim(),
          organizationType: editType,
          description: editDescription.trim(),
          website: editWebsite.trim(),
          contactEmail: editContactEmail.trim(),
          logoUrl: editLogoUrl.trim(),
        },
      });

      showToast("Organization details updated successfully!");
      loadOrg(orgData.organizationId);
    } catch (err) {
      showToast(err.message || "Failed to update organization", "error");
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Organization
  const handleDeleteOrg = async () => {
    if (!orgData?.organizationId) return;

    try {
      await apiRequest(`/api/organizations/${orgData.organizationId}`, {
        method: "DELETE",
        token,
      });

      showToast("Organization deleted successfully.");
      setDeleteConfirmOpen(false);
      loadOrg();
    } catch (err) {
      showToast(err.message || "Failed to delete organization", "error");
    }
  };

  // Create Organization (Data Flow: User submits -> POST /api/organizations -> Spring Boot -> DB -> State update)
  const handleCreateOrgSubmit = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setCreateLoading(true);
    try {
      const res = await apiRequest("/api/organizations", {
        method: "POST",
        token,
        body: {
          name: createName.trim(),
          organizationType: createType,
          description: createDescription.trim(),
          website: createWebsite.trim(),
          contactEmail: createContactEmail.trim(),
          logoUrl: createLogoUrl.trim(),
          department: createDept.trim() || "Management",
        },
      });

      showToast(`Welcome to ${res.name || "your new organization"}!`);
      setCreateOrgModalOpen(false);
      setCreateName("");
      setCreateDescription("");
      loadOrg(res.organizationId);
    } catch (err) {
      showToast(err.message || "Failed to create organization", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  // Copy invitation link
  const handleCopyLink = (tokenVal) => {
    const link = `${window.location.origin}/accept-invite?token=${tokenVal}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedToken(tokenVal);
      showToast("Invitation link copied to clipboard!");
      setTimeout(() => setCopiedToken(null), 2500);
    });
  };

  // Resend invitation
  const handleResendInvite = async (invitationId) => {
    if (!orgData?.organizationId) return;
    try {
      await apiRequest(`/api/organizations/${orgData.organizationId}/invitations/${invitationId}/resend`, {
        method: "POST",
        token,
      });
      showToast("Invitation resent successfully!");
      loadOrg(orgData.organizationId);
    } catch (err) {
      showToast(err.message || "Failed to resend invitation", "error");
    }
  };

  // Revoke invitation
  const handleRevokeInvite = async (invitationId) => {
    if (!orgData?.organizationId) return;
    try {
      await apiRequest(`/api/organizations/${orgData.organizationId}/invitations/${invitationId}`, {
        method: "DELETE",
        token,
      });
      showToast("Invitation revoked.");
      loadOrg(orgData.organizationId);
    } catch (err) {
      showToast(err.message || "Failed to revoke invitation", "error");
    }
  };

  if (loading && !orgData) {
    return (
      <div className="panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={24} className="spin" style={{ marginBottom: "12px" }} />
        <p>Loading organization workspace...</p>
      </div>
    );
  }

  // If user has no organization yet, show onboarding
  if (!orgData?.hasOrganization) {
    return (
      <div className="panel" style={{ padding: "48px 32px", textAlign: "center", maxWidth: "640px", margin: "40px auto", borderRadius: "16px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "rgba(141, 155, 114, 0.2)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Building2 size={32} />
        </div>

        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 8px" }}>
          Create an Organization Workspace
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 24px" }}>
          Collaborate with your enterprise team, manage departmental carbon budgets, track employee footprint benchmarks, and invite colleagues to achieve collective climate goals.
        </p>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setCreateOrgModalOpen(true)}
          style={{ padding: "12px 24px", fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={18} />
          <span>Create Organization</span>
        </button>

        {/* Modal: Create Organization */}
        {createOrgModalOpen && (
          <CreateOrgModal
            createName={createName}
            setCreateName={setCreateName}
            createType={createType}
            setCreateType={setCreateType}
            createDescription={createDescription}
            setCreateDescription={setCreateDescription}
            createWebsite={createWebsite}
            setCreateWebsite={setCreateWebsite}
            createContactEmail={createContactEmail}
            setCreateContactEmail={setCreateContactEmail}
            createLogoUrl={createLogoUrl}
            setCreateLogoUrl={setCreateLogoUrl}
            createDept={createDept}
            setCreateDept={setCreateDept}
            createLoading={createLoading}
            onSubmit={handleCreateOrgSubmit}
            onClose={() => setCreateOrgModalOpen(false)}
          />
        )}
      </div>
    );
  }

  const totalEmissions = Number(orgData?.totalEmissionsKg || 0);
  const avgPerMember = Number(orgData?.averagePerMemberKg || 0);
  const monthlyTarget = Number(orgData?.organizationMonthlyTarget || 500);
  const workspaces = orgData?.workspaces || [];

  return (
    <div className="organisation-page">
      {/* Toast banner */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 3000,
            padding: "12px 18px",
            borderRadius: "10px",
            background: toast.type === "success" ? "#10b981" : "#ef4444",
            color: "#ffffff",
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            fontSize: "0.88rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(239, 68, 68, 0.12)",
            color: "#ef4444",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            marginBottom: "16px",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Top Workspace Header & Multi-Organization Switcher */}
      <div className="panel" style={{ padding: "20px 24px", borderRadius: "14px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "12px",
                background: "rgba(141, 155, 114, 0.18)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "1.2rem",
                fontWeight: 800,
              }}
            >
              {orgData?.name?.slice(0, 2).toUpperCase() || "CT"}
            </div>

            <div>
              {/* Workspace Selector Dropdown */}
              <div style={{ position: "relative", display: "inline-block" }}>
                <button
                  type="button"
                  onClick={() => setWorkspaceDropdownOpen((prev) => !prev)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "var(--text-main)" }}>
                    {orgData?.name}
                  </h2>
                  {workspaces.length > 1 && <ChevronDown size={18} style={{ color: "var(--text-muted)" }} />}
                </button>

                {workspaceDropdownOpen && workspaces.length > 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: "8px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "8px",
                      minWidth: "220px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                      zIndex: 100,
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", padding: "4px 8px", fontWeight: 700, textTransform: "uppercase" }}>
                      Switch Organization Workspace
                    </div>
                    {workspaces.map((ws) => (
                      <button
                        key={ws.organizationId}
                        type="button"
                        onClick={() => {
                          setWorkspaceDropdownOpen(false);
                          loadOrg(ws.organizationId);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "none",
                          background: ws.isCurrent ? "var(--bg-subtle)" : "transparent",
                          fontWeight: ws.isCurrent ? 700 : 500,
                          color: "var(--text-main)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        <span>{ws.name}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 700 }}>
                          {ws.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.76rem", padding: "2px 8px", borderRadius: "12px", background: "var(--bg-subtle)", color: "var(--text-muted)", fontWeight: 600 }}>
                  {orgData?.type || "COMPANY"}
                </span>

                <span
                  style={{
                    fontSize: "0.76rem",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background:
                      userRole === "OWNER"
                        ? "rgba(245, 158, 11, 0.15)"
                        : userRole === "ADMIN"
                        ? "rgba(16, 185, 129, 0.15)"
                        : "rgba(148, 163, 184, 0.15)",
                    color:
                      userRole === "OWNER"
                        ? "#d97706"
                        : userRole === "ADMIN"
                        ? "#10b981"
                        : "var(--text-muted)",
                  }}
                >
                  <ShieldCheck size={13} /> {userRole}
                </span>

                {orgData?.website && (
                  <a
                    href={orgData.website.startsWith("http") ? orgData.website : `https://${orgData.website}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "0.76rem", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <Globe size={12} /> {orgData.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isAdminOrOwner && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setInviteModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "0.85rem",
                  borderRadius: "8px",
                }}
              >
                <UserPlus size={15} />
                <span>Invite Colleague</span>
              </button>
            )}

            <button
              type="button"
              className="btn-outline"
              onClick={() => setCreateOrgModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                fontSize: "0.85rem",
                borderRadius: "8px",
              }}
            >
              <Plus size={15} />
              <span>New Org</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar (All 6 sections) */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          borderBottom: "1px solid var(--border)",
          marginBottom: "20px",
          overflowX: "auto",
          paddingBottom: "2px",
        }}
      >
        {[
          { id: "overview", label: "Overview" },
          { id: "members", label: `Members (${orgData?.members?.length || 0})` },
          { id: "departments", label: `Departments (${orgData?.departments?.length || 0})` },
          ...(isAdminOrOwner
            ? [{ id: "invitations", label: `Invitations (${orgData?.invitations?.length || 0})` }]
            : []),
          { id: "analytics", label: "Organization Analytics" },
          ...(isAdminOrOwner ? [{ id: "settings", label: "Settings" }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 16px",
              border: "none",
              background: "transparent",
              borderBottom: activeTab === tab.id ? "3px solid var(--primary)" : "3px solid transparent",
              color: activeTab === tab.id ? "var(--text-main)" : "var(--text-muted)",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.86rem",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: OVERVIEW                                                  */}
      {/* ==================================================================== */}
      {activeTab === "overview" && (
        <div>
          {/* KPI Statistics */}
          <div className="org-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div className="panel" style={{ padding: "18px", borderRadius: "12px" }}>
              <div style={{ color: "var(--primary)", marginBottom: "8px" }}><Building2 size={20} /></div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Org Emissions</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, margin: "2px 0" }}>{totalEmissions.toFixed(1)} kg</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Daily rate: {Number(orgData?.averageDailyCo2eKg || 0).toFixed(2)} kg/day</div>
            </div>

            <div className="panel" style={{ padding: "18px", borderRadius: "12px" }}>
              <div style={{ color: "var(--primary)", marginBottom: "8px" }}><Users size={20} /></div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Active Members</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, margin: "2px 0" }}>{orgData?.activeUsersCount || orgData?.totalMembers || 0} / {orgData?.totalMembers || 0}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Avg {avgPerMember.toFixed(1)} kg / employee</div>
            </div>

            <div className="panel" style={{ padding: "18px", borderRadius: "12px" }}>
              <div style={{ color: "var(--primary)", marginBottom: "8px" }}><TrendingDown size={20} /></div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>CO₂e Saved vs Cap</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, margin: "2px 0" }}>{Number(orgData?.totalCo2eSavedKg || 0).toFixed(1)} kg</div>
              <div style={{ fontSize: "0.75rem", color: totalEmissions <= monthlyTarget ? "var(--emerald)" : "var(--red)" }}>
                Monthly limit: {monthlyTarget} kg
              </div>
            </div>

            <div className="panel" style={{ padding: "18px", borderRadius: "12px" }}>
              <div style={{ color: "var(--primary)", marginBottom: "8px" }}><Award size={20} /></div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Goals Achieved</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, margin: "2px 0" }}>{orgData?.goalsAchievedCount || 0}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Across team initiatives</div>
            </div>
          </div>

          {/* Department Breakdown & Monthly Trajectory */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "20px" }}>
            <div className="panel" style={{ padding: "20px", borderRadius: "14px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "1.05rem", fontWeight: 700 }}>Department Breakdown</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(orgData?.departments || []).map((dept) => {
                  const maxEm = Math.max(...(orgData?.departments || []).map((d) => Number(d.emissions || 1)), 1);
                  const pct = Math.round((Number(dept.emissions) / maxEm) * 100);
                  return (
                    <div key={dept.name} style={{ padding: "10px", borderRadius: "8px", background: "var(--bg-subtle)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
                        <strong>{dept.name}</strong>
                        <span>{Number(dept.emissions).toFixed(1)} kg CO₂e ({dept.memberCount} members)</span>
                      </div>
                      <div style={{ height: "6px", borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)", borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="panel" style={{ padding: "20px", borderRadius: "14px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "1.05rem", fontWeight: 700 }}>Monthly Trajectory</h3>
              <div style={{ height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orgData?.monthlyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                    <Tooltip formatter={(val) => [`${Number(val).toFixed(2)} kg CO₂e`, "Emissions"]} />
                    <Bar dataKey="co2e" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: MEMBERS MANAGEMENT                                        */}
      {/* ==================================================================== */}
      {activeTab === "members" && (
        <div className="panel" style={{ padding: "20px", borderRadius: "14px" }}>
          {/* Search & Filter Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
              <div style={{ position: "relative", minWidth: "220px" }}>
                <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search members or departments..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "8px 12px 8px 32px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-subtle)",
                    color: "var(--text-main)",
                    fontSize: "0.84rem",
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-main)", fontSize: "0.84rem" }}
              >
                <option value="ALL">All Roles</option>
                <option value="OWNER">Owners</option>
                <option value="ADMIN">Admins</option>
                <option value="MEMBER">Members</option>
              </select>

              <select
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-main)", fontSize: "0.84rem" }}
              >
                <option value="ALL">All Departments</option>
                {allDepartments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-main)", fontSize: "0.84rem" }}
              >
                <option value="emissions">Sort by Emissions (Lowest first)</option>
                <option value="activities">Sort by Activity Count</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`btn-outline ${viewMode === "table" ? "active" : ""}`}
                style={{ padding: "6px 10px", borderRadius: "6px" }}
                title="Table View"
              >
                <TableIcon size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`btn-outline ${viewMode === "cards" ? "active" : ""}`}
                style={{ padding: "6px 10px", borderRadius: "6px" }}
                title="Cards View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          {/* Members Table */}
          {viewMode === "table" ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                    <th style={{ padding: "10px" }}>Member</th>
                    <th style={{ padding: "10px" }}>Department</th>
                    <th style={{ padding: "10px" }}>Role</th>
                    <th style={{ padding: "10px" }}>Emissions</th>
                    <th style={{ padding: "10px" }}>Logs</th>
                    {isAdminOrOwner && <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.map((m) => (
                    <tr key={m.memberId} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <UserAvatar src={m.avatarUrl} seed={m.avatarSeed} name={m.name} size={32} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{m.name}</div>
                            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "6px", background: "var(--bg-subtle)", fontSize: "0.76rem" }}>
                          {m.department || "General"}
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.76rem", color: m.role === "OWNER" ? "#d97706" : m.role === "ADMIN" ? "#10b981" : "var(--text-muted)" }}>
                          {m.role}
                        </span>
                      </td>
                      <td style={{ padding: "10px", fontWeight: 700 }}>
                        {Number(m.emissions).toFixed(1)} kg
                      </td>
                      <td style={{ padding: "10px", color: "var(--text-muted)" }}>
                        {m.activitiesCount}
                      </td>
                      {isAdminOrOwner && (
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          {m.role !== "OWNER" && (
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="btn-outline"
                                onClick={() => {
                                  setTargetMemberForDept(m);
                                  setChangeDeptModalOpen(true);
                                }}
                                style={{ padding: "4px 8px", fontSize: "0.74rem" }}
                              >
                                Dept
                              </button>
                              <button
                                type="button"
                                className="btn-outline"
                                onClick={() => handleUpdateRole(m.userId, m.role === "ADMIN" ? "MEMBER" : "ADMIN")}
                                style={{ padding: "4px 8px", fontSize: "0.74rem" }}
                              >
                                {m.role === "ADMIN" ? "Demote" : "Promote"}
                              </button>
                              <button
                                type="button"
                                className="btn-outline"
                                onClick={() => setMemberToRemove(m)}
                                style={{ padding: "4px 8px", fontSize: "0.74rem", color: "#ef4444" }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {paginatedMembers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                        No members match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
              {paginatedMembers.map((m) => (
                <div key={m.memberId} style={{ padding: "14px", borderRadius: "10px", background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <UserAvatar src={m.avatarUrl} seed={m.avatarSeed} name={m.name} size={40} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.name}</div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{m.department || "General"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "10px" }}>
                    <span>Role: <strong>{m.role}</strong></span>
                    <span>Footprint: <strong>{Number(m.emissions).toFixed(1)} kg</strong></span>
                  </div>
                  {isAdminOrOwner && m.role !== "OWNER" && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => {
                          setTargetMemberForDept(m);
                          setChangeDeptModalOpen(true);
                        }}
                        style={{ flex: 1, padding: "4px 8px", fontSize: "0.74rem" }}
                      >
                        Change Dept
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => handleUpdateRole(m.userId, m.role === "ADMIN" ? "MEMBER" : "ADMIN")}
                        style={{ flex: 1, padding: "4px 8px", fontSize: "0.74rem" }}
                      >
                        {m.role === "ADMIN" ? "Demote" : "Promote"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Page {safePage} of {totalPages} ({filteredMembers.length} members)
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className="btn-outline"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 3: DEPARTMENTS                                               */}
      {/* ==================================================================== */}
      {activeTab === "departments" && (
        <div className="panel" style={{ padding: "20px", borderRadius: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: "0 0 2px", fontSize: "1.05rem", fontWeight: 700 }}>Department Roster & Emissions</h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Organize members by team to track operational benchmarks and departmental reductions.
              </p>
            </div>

            {isAdminOrOwner && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setAddDeptModalOpen(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "0.85rem", borderRadius: "8px" }}
              >
                <Plus size={15} /> Add Department
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {(orgData?.departments || []).map((dept) => (
              <div key={dept.name} style={{ padding: "16px", borderRadius: "10px", background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Briefcase size={16} style={{ color: "var(--primary)" }} />
                    <strong style={{ fontSize: "0.95rem" }}>{dept.name}</strong>
                  </div>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    {dept.memberCount || 1} members
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", margin: "8px 0" }}>
                  <span style={{ color: "var(--text-muted)" }}>Total Footprint:</span>
                  <strong>{Number(dept.emissions || 0).toFixed(1)} kg CO₂e</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "12px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Avg per Member:</span>
                  <strong>{Number(dept.averagePerMemberKg || 0).toFixed(1)} kg</strong>
                </div>

                {Array.isArray(dept.members) && dept.members.length > 0 && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                    <span>Members: {dept.members.slice(0, 3).join(", ")}{dept.members.length > 3 ? ` +${dept.members.length - 3} more` : ""}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 4: INVITATIONS                                               */}
      {/* ==================================================================== */}
      {activeTab === "invitations" && isAdminOrOwner && (
        <div className="panel" style={{ padding: "20px", borderRadius: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: "0 0 2px", fontSize: "1.05rem", fontWeight: 700 }}>Pending Organization Invitations</h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Invitations for coworkers to join this organization workspace.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setInviteModalOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "0.85rem", borderRadius: "8px" }}
            >
              <UserPlus size={15} /> New Invitation
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "10px" }}>Invited Email</th>
                  <th style={{ padding: "10px" }}>Assigned Role</th>
                  <th style={{ padding: "10px" }}>Department</th>
                  <th style={{ padding: "10px" }}>Expires In</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(orgData?.invitations || []).map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px", fontWeight: 600 }}>{inv.email}</td>
                    <td style={{ padding: "10px" }}>{inv.role}</td>
                    <td style={{ padding: "10px" }}>{inv.department || "General"}</td>
                    <td style={{ padding: "10px", color: "var(--text-muted)" }}>
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => handleCopyLink(inv.invitationToken)}
                          style={{ padding: "4px 8px", fontSize: "0.74rem" }}
                        >
                          {copiedToken === inv.invitationToken ? <Check size={13} /> : <Copy size={13} />}
                          <span>Link</span>
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => handleResendInvite(inv.id)}
                          style={{ padding: "4px 8px", fontSize: "0.74rem" }}
                        >
                          Resend
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => handleRevokeInvite(inv.id)}
                          style={{ padding: "4px 8px", fontSize: "0.74rem", color: "#ef4444" }}
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(orgData?.invitations || []).length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                      No pending organization invitations dispatched.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 5: ORGANIZATION ANALYTICS                                    */}
      {/* ==================================================================== */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Department Comparison Bar Chart */}
          <div className="panel" style={{ padding: "20px", borderRadius: "14px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1.05rem", fontWeight: 700 }}>
              Department Footprint Comparison
            </h3>
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgData?.departments || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <Tooltip formatter={(val) => [`${Number(val).toFixed(2)} kg CO₂e`, "Emissions"]} />
                  <Bar dataKey="emissions" name="Total Emissions" fill="#8D9B72" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="averagePerMemberKg" name="Avg / Employee" fill="#5C8CA6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Donut */}
          <div className="panel" style={{ padding: "20px", borderRadius: "14px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1.05rem", fontWeight: 700 }}>
              Organization Emissions by Activity Segment
            </h3>
            <div style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orgData?.categoryBreakdown || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {(orgData?.categoryBreakdown || []).map((entry, idx) => (
                      <Cell key={entry.name} fill={ORG_CHART_COLORS[idx % ORG_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${Number(val).toFixed(2)} kg CO₂e`, "Emissions"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 6: SETTINGS                                                  */}
      {/* ==================================================================== */}
      {activeTab === "settings" && isAdminOrOwner && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="panel" style={{ padding: "24px", borderRadius: "14px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1.05rem", fontWeight: 700 }}>
              Organization Profile & Settings
            </h3>

            <form onSubmit={handleEditOrgSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px" }}>
                    Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-main)", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px" }}>
                    Organization Type / Industry
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-main)", boxSizing: "border-box" }}
                  >
                    <option value="COMPANY">Company / Enterprise</option>
                    <option value="UNIVERSITY">University / Academic</option>
                    <option value="NGO">NGO / Non-Profit</option>
                    <option value="GOVERNMENT">Government Agency</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px" }}>
                    Website URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-main)", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px" }}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="sustainability@example.com"
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-main)", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px" }}>
                  Description / Sustainability Mandate
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-main)", boxSizing: "border-box" }}
                />
              </div>

              <button
                type="submit"
                disabled={editLoading}
                className="btn-primary"
                style={{ padding: "9px 20px", fontSize: "0.86rem", borderRadius: "8px" }}
              >
                {editLoading ? "Saving Changes..." : "Save Settings"}
              </button>
            </form>
          </div>

          {/* Owner Danger Zone */}
          {isOwner && (
            <div className="panel" style={{ padding: "20px 24px", borderRadius: "14px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              <h4 style={{ margin: "0 0 6px", color: "#ef4444", fontSize: "0.95rem" }}>
                Danger Zone: Delete Organization
              </h4>
              <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Permanently removes the organization workspace and unlinks all members. This cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                Delete Organization
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODALS                                                               */}
      {/* ==================================================================== */}

      {/* Modal: Invite Member */}
      {inviteModalOpen && (
        <div className="modal-overlay" style={modalOverlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setInviteModalOpen(false); }}>
          <div className="modal-card" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Invite Team Member to Organization</h3>
              <button type="button" onClick={() => setInviteModalOpen(false)} style={closeBtnStyle}><X size={18} /></button>
            </div>
            <form onSubmit={handleInviteSubmit} style={{ padding: "20px" }}>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Colleague's Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Assigned Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={inputStyle}>
                  <option value="MEMBER">Member (Standard activity tracking)</option>
                  <option value="ADMIN">Administrator (Can invite and manage)</option>
                </select>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={labelStyle}>Department</label>
                <input
                  type="text"
                  placeholder="Engineering, Marketing, Operations..."
                  value={inviteDept}
                  onChange={(e) => setInviteDept(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <button type="submit" disabled={inviteLoading} className="btn-primary" style={{ width: "100%", padding: "10px", borderRadius: "8px" }}>
                {inviteLoading ? "Sending Invitation..." : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Department */}
      {addDeptModalOpen && (
        <div className="modal-overlay" style={modalOverlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setAddDeptModalOpen(false); }}>
          <div className="modal-card" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Add Organization Department</h3>
              <button type="button" onClick={() => setAddDeptModalOpen(false)} style={closeBtnStyle}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddDepartmentSubmit} style={{ padding: "20px" }}>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sustainability, Research & Development"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={labelStyle}>Assign Member (Optional)</label>
                <select value={newDeptMemberId} onChange={(e) => setNewDeptMemberId(e.target.value)} style={inputStyle}>
                  <option value="">None (create department placeholder)</option>
                  {(orgData?.members || []).map((m) => (
                    <option key={m.userId} value={m.userId}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={deptLoading} className="btn-primary" style={{ width: "100%", padding: "10px", borderRadius: "8px" }}>
                {deptLoading ? "Saving..." : "Add Department"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Member Department */}
      {changeDeptModalOpen && targetMemberForDept && (
        <div className="modal-overlay" style={modalOverlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setChangeDeptModalOpen(false); }}>
          <div className="modal-card" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Assign Department: {targetMemberForDept.name}</h3>
              <button type="button" onClick={() => setChangeDeptModalOpen(false)} style={closeBtnStyle}><X size={18} /></button>
            </div>
            <div style={{ padding: "20px" }}>
              <label style={labelStyle}>Select or Enter Department</label>
              <input
                type="text"
                defaultValue={targetMemberForDept.department || "General"}
                id="target-dept-input"
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const val = document.getElementById("target-dept-input")?.value || "General";
                    handleUpdateDept(targetMemberForDept.userId, val);
                  }}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px" }}
                >
                  Save Department
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setChangeDeptModalOpen(false)}
                  style={{ padding: "10px", borderRadius: "8px" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Member */}
      {memberToRemove && (
        <div className="modal-overlay" style={modalOverlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setMemberToRemove(null); }}>
          <div className="modal-card" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#ef4444" }}>Remove Team Member</h3>
              <button type="button" onClick={() => setMemberToRemove(null)} style={closeBtnStyle}><X size={18} /></button>
            </div>
            <div style={{ padding: "20px" }}>
              <p style={{ margin: "0 0 16px", fontSize: "0.86rem", color: "var(--text-main)" }}>
                Are you sure you want to remove <strong>{memberToRemove.name}</strong> from {orgData?.name}?
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={handleRemoveMember} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "#ef4444", color: "#fff", border: "none", fontWeight: 700 }}>
                  Confirm Removal
                </button>
                <button type="button" className="btn-outline" onClick={() => setMemberToRemove(null)} style={{ padding: "10px", borderRadius: "8px" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Org */}
      {deleteConfirmOpen && (
        <div className="modal-overlay" style={modalOverlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmOpen(false); }}>
          <div className="modal-card" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#ef4444" }}>Confirm Organization Deletion</h3>
              <button type="button" onClick={() => setDeleteConfirmOpen(false)} style={closeBtnStyle}><X size={18} /></button>
            </div>
            <div style={{ padding: "20px" }}>
              <p style={{ margin: "0 0 16px", fontSize: "0.86rem", color: "var(--text-main)" }}>
                Are you sure you want to delete <strong>{orgData?.name}</strong>? All organization data will be removed.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={handleDeleteOrg} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "#ef4444", color: "#fff", border: "none", fontWeight: 700 }}>
                  Permanently Delete
                </button>
                <button type="button" className="btn-outline" onClick={() => setDeleteConfirmOpen(false)} style={{ padding: "10px", borderRadius: "8px" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Org */}
      {createOrgModalOpen && (
        <CreateOrgModal
          createName={createName}
          setCreateName={setCreateName}
          createType={createType}
          setCreateType={setCreateType}
          createDescription={createDescription}
          setCreateDescription={setCreateDescription}
          createWebsite={createWebsite}
          setCreateWebsite={setCreateWebsite}
          createContactEmail={createContactEmail}
          setCreateContactEmail={setCreateContactEmail}
          createLogoUrl={createLogoUrl}
          setCreateLogoUrl={setCreateLogoUrl}
          createDept={createDept}
          setCreateDept={setCreateDept}
          createLoading={createLoading}
          onSubmit={handleCreateOrgSubmit}
          onClose={() => setCreateOrgModalOpen(false)}
        />
      )}
    </div>
  );
}

// Subcomponent: Create Organization Modal
function CreateOrgModal({
  createName,
  setCreateName,
  createType,
  setCreateType,
  createDescription,
  setCreateDescription,
  createWebsite,
  setCreateWebsite,
  createContactEmail,
  setCreateContactEmail,
  createLogoUrl,
  setCreateLogoUrl,
  createDept,
  setCreateDept,
  createLoading,
  onSubmit,
  onClose,
}) {
  return (
    <div className="modal-overlay" style={modalOverlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ ...modalCardStyle, maxWidth: "540px" }}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Create Organization Workspace</h3>
          <button type="button" onClick={onClose} style={closeBtnStyle}><X size={18} /></button>
        </div>
        <form onSubmit={onSubmit} style={{ padding: "20px" }}>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Organization Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Sustainability Inc."
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={labelStyle}>Industry / Type</label>
              <select value={createType} onChange={(e) => setCreateType(e.target.value)} style={inputStyle}>
                <option value="COMPANY">Company</option>
                <option value="UNIVERSITY">University</option>
                <option value="NGO">NGO</option>
                <option value="GOVERNMENT">Government</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Your Department</label>
              <input
                type="text"
                placeholder="Management, R&D..."
                value={createDept}
                onChange={(e) => setCreateDept(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Description / Carbon Mission</label>
            <textarea
              rows={2}
              placeholder="Our enterprise commitment to net-zero..."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
            <div>
              <label style={labelStyle}>Website (Optional)</label>
              <input
                type="text"
                placeholder="https://..."
                value={createWebsite}
                onChange={(e) => setCreateWebsite(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Contact Email</label>
              <input
                type="email"
                placeholder="admin@..."
                value={createContactEmail}
                onChange={(e) => setCreateContactEmail(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>Logo URL (Optional)</label>
            <input
              type="text"
              placeholder="https://.../logo.png"
              value={createLogoUrl}
              onChange={(e) => setCreateLogoUrl(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={createLoading} className="btn-primary" style={{ width: "100%", padding: "10px", borderRadius: "8px" }}>
            {createLoading ? "Creating Organization..." : "Create Organization"}
          </button>
        </form>
      </div>
    </div>
  );
}

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.65)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2100,
  padding: "16px",
};

const modalCardStyle = {
  background: "var(--bg-card)",
  borderRadius: "14px",
  border: "1px solid var(--border)",
  width: "100%",
  maxWidth: "460px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
};

const modalHeaderStyle = {
  padding: "16px 20px",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const closeBtnStyle = {
  background: "transparent",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: "4px",
};

const labelStyle = {
  display: "block",
  fontSize: "0.82rem",
  fontWeight: 600,
  marginBottom: "6px",
  color: "var(--text-main)",
};

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg-subtle)",
  color: "var(--text-main)",
  fontSize: "0.85rem",
  outline: "none",
  boxSizing: "border-box",
};
