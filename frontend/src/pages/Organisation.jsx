import { useEffect, useState, useMemo } from "react";
import {
  Building2,
  Users,
  Leaf,
  TrendingDown,
  TrendingUp,
  Download,
  Search,
  CalendarDays,
  AlertCircle,
  RefreshCw,
  Award,
  Plus,
  UserPlus,
  Settings,
  Trash2,
  ExternalLink,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Globe,
  Tag,
  Briefcase,
  X,
  Edit,
  ChevronDown,
  LayoutGrid,
  Table as TableIcon,
  Filter,
} from "lucide-react";
import { apiRequest } from "../api";

export default function Organisation({ token }) {
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  // Tabs & Views
  const [activeTab, setActiveTab] = useState("members"); // 'members' | 'departments' | 'invitations'
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'

  // Search & Filter
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("emissions");

  // Modals state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editOrgModalOpen, setEditOrgModalOpen] = useState(false);
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);

  // Form states - Invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteDept, setInviteDept] = useState("Engineering");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Form states - Edit Org
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

  const loadOrg = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/api/organizations/my", { token });
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
  };

  useEffect(() => {
    if (token) loadOrg();
  }, [token]);

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
    (orgData?.members || []).forEach((m) => {
      if (m.department) set.add(m.department);
    });
    return Array.from(set);
  }, [orgData]);

  // --- ACTIONS ---

  // Invite Member
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

      showToast(res.message || "Member invited successfully!");
      setInviteModalOpen(false);
      setInviteEmail("");
      loadOrg();
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
      loadOrg();
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
      loadOrg();
    } catch (err) {
      showToast(err.message || "Failed to update role", "error");
    }
  };

  // Edit Organization
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
      setEditOrgModalOpen(false);
      loadOrg();
    } catch (err) {
      showToast(err.message || "Failed to update organization", "error");
    } finally {
      setEditLoading(false);
    }
  };

  // Create Organization
  const handleCreateOrgSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      await apiRequest("/api/organizations", {
        method: "POST",
        token,
        body: {
          name: createName.trim(),
          organizationType: createType,
          description: createDescription.trim(),
          website: createWebsite.trim(),
          contactEmail: createContactEmail.trim(),
          logoUrl: createLogoUrl.trim(),
        },
      });

      showToast("Organization workspace created successfully!");
      setCreateOrgModalOpen(false);
      loadOrg();
    } catch (err) {
      showToast(err.message || "Failed to create organization", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  // Delete Organization
  const handleDeleteOrganization = async () => {
    if (!orgData?.organizationId) return;

    try {
      await apiRequest(`/api/organizations/${orgData.organizationId}`, {
        method: "DELETE",
        token,
      });

      showToast("Organization was deleted successfully.");
      setDeleteConfirmOpen(false);
      loadOrg();
    } catch (err) {
      showToast(err.message || "Failed to delete organization", "error");
    }
  };

  // Revoke Invitation
  const handleRevokeInvitation = async (invitationId) => {
    if (!orgData?.organizationId) return;

    try {
      await apiRequest(`/api/organizations/${orgData.organizationId}/invitations/${invitationId}`, {
        method: "DELETE",
        token,
      });

      showToast("Invitation revoked.");
      loadOrg();
    } catch (err) {
      showToast(err.message || "Failed to revoke invitation", "error");
    }
  };

  const totalEmissions = Number(orgData?.totalEmissionsKg || 0);
  const avgPerMember = Number(orgData?.averagePerMemberKg || 0);
  const monthlyTarget = Number(orgData?.organizationMonthlyTarget || 1200);

  // If user doesn't belong to any organization
  if (!loading && orgData && orgData.hasOrganization === false) {
    return (
      <div className="page-content organisation-page">
        <div className="panel" style={{ padding: "48px 24px", textAlign: "center", maxWidth: "600px", margin: "40px auto" }}>
          <div className="icon-badge bg-green" style={{ width: "64px", height: "64px", margin: "0 auto 16px" }}>
            <Building2 size={32} />
          </div>
          <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>
            Join or Create an Organization
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
            Collaborate with your team, benchmark departmental emissions, and drive enterprise-wide sustainability goals together.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreateOrgModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", margin: "0 auto" }}
          >
            <Plus size={18} /> Create Organization Workspace
          </button>
        </div>

        {/* Modal: Create Organization */}
        {createOrgModalOpen && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: "520px" }}>
              <div className="modal-header">
                <h3>Create Organization Workspace</h3>
                <button type="button" onClick={() => setCreateOrgModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateOrgSubmit} style={{ padding: "20px" }}>
                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label>Organization Name *</label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Acme Sustainability Corp"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label>Organization Type</label>
                  <select value={createType} onChange={(e) => setCreateType(e.target.value)}>
                    <option value="COMPANY">Company / Enterprise</option>
                    <option value="UNIVERSITY">University / Education</option>
                    <option value="NGO">Non-Profit / NGO</option>
                    <option value="GOVERNMENT">Government Agency</option>
                    <option value="OTHER">Community Coalition</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label>Description</label>
                  <textarea
                    rows="2"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Brief description of your organization's mission"
                  />
                </div>
                <div className="form-row-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div className="form-group">
                    <label>Website URL</label>
                    <input
                      type="url"
                      value={createWebsite}
                      onChange={(e) => setCreateWebsite(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Email</label>
                    <input
                      type="email"
                      value={createContactEmail}
                      onChange={(e) => setCreateContactEmail(e.target.value)}
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                  <button type="button" className="btn-outline" onClick={() => setCreateOrgModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={createLoading}>
                    {createLoading ? "Creating..." : "Create Organization"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-content organisation-page">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`org-toast-alert ${toast.type === "error" ? "toast-error" : "toast-success"}`}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1500,
            padding: "12px 18px",
            borderRadius: "var(--radius-md)",
            background: toast.type === "error" ? "#ef4444" : "#10b981",
            color: "#ffffff",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13.5px",
            fontWeight: "500",
            animation: "authFadeIn 0.2s ease-out",
          }}
        >
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Heading & Action Buttons */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h2>Organization</h2>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                padding: "2px 8px",
                borderRadius: "999px",
                background: "rgba(16, 185, 129, 0.12)",
                color: "var(--primary-emerald)",
              }}
            >
              {orgData?.type || "ENTERPRISE"}
            </span>
          </div>
          <p>
            Manage team members, roles, and aggregate footprint.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn-outline"
            onClick={loadOrg}
            disabled={loading}
            title="Refresh workspace data"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {isAdminOrOwner && (
            <>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setEditOrgModalOpen(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Settings size={15} />
                Manage Org
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setInviteModalOpen(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <UserPlus size={16} />
                Invite Member
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Organization Hero Profile Overview Banner */}
      <div
        className="panel"
        style={{
          padding: "24px",
          marginBottom: "24px",
          position: "relative",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              className="icon-badge bg-green"
              style={{
                width: "60px",
                height: "60px",
                fontSize: "24px",
                fontWeight: "800",
                color: "var(--primary-forest)",
                background: "rgba(22, 101, 52, 0.12)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {orgData?.logoUrl ? (
                <img src={orgData.logoUrl} alt={orgData.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Building2 size={30} />
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-primary)" }}>
                  {orgData?.name || "Corporate Sustainability Portal"}
                </h3>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "6px",
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
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px", maxWidth: "600px", lineHeight: "1.5" }}>
                {orgData?.description || "Collaborative workforce driving carbon footprint reduction and green best practices."}
              </p>

              {/* Links & Contact */}
              <div style={{ display: "flex", gap: "16px", marginTop: "10px", flexWrap: "wrap", fontSize: "12.5px" }}>
                {orgData?.website && (
                  <a
                    href={orgData.website.startsWith("http") ? orgData.website : `https://${orgData.website}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--primary-emerald)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <Globe size={13} /> {orgData.website.replace(/^https?:\/\//, "")} <ExternalLink size={11} />
                  </a>
                )}
                {orgData?.contactEmail && (
                  <span style={{ color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Mail size={13} /> {orgData.contactEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick switcher / create new button */}
          <button
            type="button"
            className="btn-outline"
            onClick={() => setCreateOrgModalOpen(true)}
            style={{ fontSize: "12px", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={14} /> New Org
          </button>
        </div>
      </div>

      {/* KPI Stats Grid (4 Cards) */}
      <div className="org-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px", marginBottom: "24px" }}>
        <div className="panel org-kpi-card" style={{ padding: "20px" }}>
          <div className="icon-badge bg-green" style={{ marginBottom: "12px" }}>
            <Building2 size={20} />
          </div>
          <span className="kpi-label" style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Workforce Footprint</span>
          <strong className="kpi-val" style={{ display: "block", fontSize: "24px", fontWeight: "800", color: "var(--text-primary)", margin: "4px 0" }}>
            {totalEmissions.toFixed(1)} kg
          </strong>
          <span className="kpi-sub" style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total logged CO₂e</span>
        </div>

        <div className="panel org-kpi-card" style={{ padding: "20px" }}>
          <div className="icon-badge bg-emerald" style={{ marginBottom: "12px" }}>
            <Users size={20} />
          </div>
          <span className="kpi-label" style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Team Members</span>
          <strong className="kpi-val" style={{ display: "block", fontSize: "24px", fontWeight: "800", color: "var(--text-primary)", margin: "4px 0" }}>
            {orgData?.totalMembers || filteredMembers.length}
          </strong>
          <span className="kpi-sub" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Avg {avgPerMember.toFixed(1)} kg / employee
          </span>
        </div>

        <div className="panel org-kpi-card" style={{ padding: "20px" }}>
          <div className="icon-badge bg-lime" style={{ marginBottom: "12px" }}>
            <TrendingDown size={20} />
          </div>
          <span className="kpi-label" style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Monthly Budget</span>
          <strong className="kpi-val" style={{ display: "block", fontSize: "24px", fontWeight: "800", color: "var(--text-primary)", margin: "4px 0" }}>
            {monthlyTarget} kg
          </strong>
          <span className="kpi-sub" style={{ fontSize: "12px", color: totalEmissions <= monthlyTarget ? "var(--primary-emerald)" : "#ef4444" }}>
            {totalEmissions <= monthlyTarget ? "Within budget ✓" : "Exceeds budget"}
          </span>
        </div>

        <div className="panel org-kpi-card" style={{ padding: "20px" }}>
          <div className="icon-badge bg-green" style={{ marginBottom: "12px" }}>
            <Clock size={20} />
          </div>
          <span className="kpi-label" style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Pending Invitations</span>
          <strong className="kpi-val" style={{ display: "block", fontSize: "24px", fontWeight: "800", color: "var(--text-primary)", margin: "4px 0" }}>
            {orgData?.pendingInvitationsCount || (orgData?.invitations || []).length}
          </strong>
          <span className="kpi-sub" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Awaiting response
          </span>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={`filter-btn ${activeTab === "members" ? "active" : ""}`}
            onClick={() => setActiveTab("members")}
            style={{
              padding: "10px 18px",
              border: "none",
              background: "transparent",
              borderBottom: activeTab === "members" ? "3px solid var(--primary-forest)" : "3px solid transparent",
              color: activeTab === "members" ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Team Members ({orgData?.members?.length || 0})
          </button>

          <button
            type="button"
            className={`filter-btn ${activeTab === "departments" ? "active" : ""}`}
            onClick={() => setActiveTab("departments")}
            style={{
              padding: "10px 18px",
              border: "none",
              background: "transparent",
              borderBottom: activeTab === "departments" ? "3px solid var(--primary-forest)" : "3px solid transparent",
              color: activeTab === "departments" ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Departments ({orgData?.departments?.length || 0})
          </button>

          {isAdminOrOwner && (
            <button
              type="button"
              className={`filter-btn ${activeTab === "invitations" ? "active" : ""}`}
              onClick={() => setActiveTab("invitations")}
              style={{
                padding: "10px 18px",
                border: "none",
                background: "transparent",
                borderBottom: activeTab === "invitations" ? "3px solid var(--primary-forest)" : "3px solid transparent",
                color: activeTab === "invitations" ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: "700",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Pending Invites ({orgData?.invitations?.length || 0})
            </button>
          )}
        </div>

        {activeTab === "members" && (
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
              title="Card Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          TAB 1: MEMBERS MANAGEMENT
         ======================================================== */}
      {activeTab === "members" && (
        <div className="panel" style={{ padding: "20px" }}>
          {/* Search & Filters Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            {/* Search Bar */}
            <div className="roster-search-box" style={{ maxWidth: "320px", flex: 1 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search member, email, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Controls */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
              </select>

              {/* Department filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
              >
                <option value="ALL">All Departments</option>
                {allDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Sort by */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
              >
                <option value="emissions">Lowest Emissions</option>
                <option value="activities">Most Activities</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Members Table View */}
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px" }} />
              <p>Loading members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              <Users size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
              <h4>No members found</h4>
              <p style={{ fontSize: "13px" }}>Try adjusting your search criteria or invite a new member.</p>
            </div>
          ) : viewMode === "table" ? (
            <div className="table-responsive">
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Activities</th>
                    <th>Carbon Output</th>
                    {isAdminOrOwner && <th style={{ textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={m.userId}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "var(--primary-forest)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "14px",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {m.avatarUrl ? (
                              <img src={m.avatarUrl} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              m.name?.charAt(0).toUpperCase() || "M"
                            )}
                          </div>
                          <div>
                            <strong>{m.name}</strong>
                            <p className="table-email" style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                              {m.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="dept-badge">{m.department || "Operations"}</span>
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background:
                              m.role === "OWNER"
                                ? "rgba(245, 158, 11, 0.15)"
                                : m.role === "ADMIN"
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(148, 163, 184, 0.15)",
                            color:
                              m.role === "OWNER"
                                ? "#d97706"
                                : m.role === "ADMIN"
                                ? "#10b981"
                                : "var(--text-muted)",
                          }}
                        >
                          {m.role}
                        </span>
                      </td>

                      <td>
                        <strong>{m.activitiesCount || 0}</strong> entries
                      </td>

                      <td>
                        <strong style={{ color: "var(--text-primary)" }}>{Number(m.emissions).toFixed(1)}</strong> kg CO₂e
                      </td>

                      {isAdminOrOwner && (
                        <td style={{ textAlign: "right" }}>
                          {m.role !== "OWNER" && (
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              {/* Change role button */}
                              {isOwner && (
                                <button
                                  type="button"
                                  className="btn-outline"
                                  style={{ padding: "4px 8px", fontSize: "11px" }}
                                  title={m.role === "ADMIN" ? "Demote to Member" : "Promote to Admin"}
                                  onClick={() => handleUpdateRole(m.userId, m.role === "ADMIN" ? "MEMBER" : "ADMIN")}
                                >
                                  {m.role === "ADMIN" ? "Make Member" : "Make Admin"}
                                </button>
                              )}

                              {/* Remove member button */}
                              <button
                                type="button"
                                className="btn-outline"
                                style={{ padding: "4px 8px", color: "#ef4444" }}
                                title="Remove member"
                                onClick={() => setMemberToRemove(m)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card Grid View */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {filteredMembers.map((m) => (
                <div
                  key={m.userId}
                  className="panel"
                  style={{
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "var(--primary-forest)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "800",
                          fontSize: "16px",
                          overflow: "hidden",
                        }}
                      >
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          m.name?.charAt(0).toUpperCase() || "M"
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background:
                            m.role === "OWNER"
                              ? "rgba(245, 158, 11, 0.15)"
                              : m.role === "ADMIN"
                              ? "rgba(16, 185, 129, 0.15)"
                              : "rgba(148, 163, 184, 0.15)",
                          color:
                            m.role === "OWNER"
                              ? "#d97706"
                              : m.role === "ADMIN"
                              ? "#10b981"
                              : "var(--text-muted)",
                        }}
                      >
                        {m.role}
                      </span>
                    </div>

                    <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "2px" }}>{m.name}</h4>
                    <p style={{ color: "var(--text-muted)", fontSize: "12.5px", marginBottom: "12px" }}>{m.email}</p>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderTop: "1px solid var(--border)", paddingTop: "10px", marginBottom: "10px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Department</span>
                      <strong style={{ color: "var(--text-primary)" }}>{m.department || "Operations"}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Emissions</span>
                      <strong style={{ color: "var(--primary-emerald)" }}>{Number(m.emissions).toFixed(1)} kg CO₂e</strong>
                    </div>
                  </div>

                  {isAdminOrOwner && m.role !== "OWNER" && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "10px", marginTop: "10px" }}>
                      {isOwner ? (
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() => handleUpdateRole(m.userId, m.role === "ADMIN" ? "MEMBER" : "ADMIN")}
                        >
                          {m.role === "ADMIN" ? "Demote" : "Promote Admin"}
                        </button>
                      ) : <span />}

                      <button
                        type="button"
                        className="btn-outline"
                        style={{ color: "#ef4444", fontSize: "11px", padding: "4px 8px" }}
                        onClick={() => setMemberToRemove(m)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: DEPARTMENTS BREAKDOWN
         ======================================================== */}
      {activeTab === "departments" && (
        <div className="panel" style={{ padding: "24px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Department Emissions Breakdown</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13.5px" }}>
              Aggregate carbon footprint categorized by organizational unit.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {orgData?.departments?.map((dept) => {
              const maxVal = Math.max(...(orgData?.departments || []).map((d) => Number(d.emissions || 1)), 1);
              const pct = Math.round((Number(dept.emissions) / maxVal) * 100);

              return (
                <div key={dept.name} className="panel" style={{ padding: "18px", background: "var(--bg-app)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>{dept.name}</strong>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {dept.memberCount || 1} {dept.memberCount === 1 ? "member" : "members"}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
                    <span style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-primary)" }}>
                      {Number(dept.emissions).toFixed(1)} <span style={{ fontSize: "12px" }}>kg CO₂e</span>
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--primary-emerald)", fontWeight: "600" }}>
                      {pct}% of max
                    </span>
                  </div>

                  <div style={{ height: "8px", borderRadius: "999px", background: "var(--border)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "999px",
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, var(--primary-forest), var(--primary-emerald))",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: PENDING INVITATIONS
         ======================================================== */}
      {activeTab === "invitations" && isAdminOrOwner && (
        <div className="panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Pending Member Invitations</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "13.5px" }}>
                Invitations dispatched awaiting acceptance by recipients.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setInviteModalOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <UserPlus size={16} /> New Invite
            </button>
          </div>

          {(orgData?.invitations || []).length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              <Clock size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
              <h4>No pending invitations</h4>
              <p style={{ fontSize: "13px" }}>All invited members have already joined this organization.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Invited Email</th>
                    <th>Assigned Role</th>
                    <th>Department</th>
                    <th>Invitation Token</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(orgData?.invitations || []).map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <strong>{inv.email}</strong>
                      </td>
                      <td>
                        <span className="dept-badge">{inv.role}</span>
                      </td>
                      <td>{inv.department || "Engineering"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ fontSize: "11px", padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          onClick={() => {
                            navigator.clipboard.writeText(inv.invitationToken);
                            setCopiedToken(inv.id);
                            setTimeout(() => setCopiedToken(null), 2000);
                          }}
                        >
                          {copiedToken === inv.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedToken === inv.id ? "Copied" : "Copy Token"}
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ color: "#ef4444", fontSize: "12px", padding: "4px 8px" }}
                          onClick={() => handleRevokeInvitation(inv.id)}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL: INVITE MEMBER
         ======================================================== */}
      {inviteModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Invite Team Member</h3>
              <button type="button" onClick={() => setInviteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} style={{ padding: "20px" }}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label>Recipient Email Address *</label>
                <input
                  type="email"
                  placeholder="employee@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label>Role</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <select value={inviteDept} onChange={(e) => setInviteDept(e.target.value)}>
                    <option value="Engineering">Engineering</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Product">Product</option>
                    <option value="Sustainability">Sustainability</option>
                  </select>
                </div>
              </div>

              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "18px" }}>
                If the user has an existing account, they will be joined immediately. Otherwise, a pending invitation will be dispatched.
              </p>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn-outline" onClick={() => setInviteModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={inviteLoading}>
                  {inviteLoading ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT ORGANIZATION DETAILS
         ======================================================== */}
      {editOrgModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "540px" }}>
            <div className="modal-header">
              <h3>Organization Settings</h3>
              <button type="button" onClick={() => setEditOrgModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditOrgSubmit} style={{ padding: "20px" }}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label>Organization Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label>Organization Category</label>
                <select value={editType} onChange={(e) => setEditType(e.target.value)}>
                  <option value="COMPANY">Company / Enterprise</option>
                  <option value="UNIVERSITY">University / Education</option>
                  <option value="NGO">Non-Profit / NGO</option>
                  <option value="GOVERNMENT">Government Agency</option>
                  <option value="OTHER">Community Coalition</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label>Description</label>
                <textarea
                  rows="2"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Organization description and sustainability mission"
                />
              </div>

              <div className="form-row-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label>Website URL</label>
                  <input
                    type="url"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="https://company.com"
                  />
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                    placeholder="sustainability@company.com"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label>Logo Image URL</label>
                <input
                  type="url"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              {isOwner && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", marginBottom: "18px" }}>
                  <label style={{ color: "#ef4444", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                    Danger Zone
                  </label>
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)", fontSize: "12.5px" }}
                    onClick={() => {
                      setEditOrgModalOpen(false);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    Delete Organization
                  </button>
                </div>
              )}

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn-outline" onClick={() => setEditOrgModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REMOVE MEMBER CONFIRMATION
         ======================================================== */}
      {memberToRemove && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "420px", textAlign: "center", padding: "24px" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>
              Remove {memberToRemove.name}?
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13.5px", lineHeight: "1.5", marginBottom: "20px" }}>
              Are you sure you want to remove <strong>{memberToRemove.email}</strong> from {orgData?.name}? They will lose access to team workspaces.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button type="button" className="btn-outline" onClick={() => setMemberToRemove(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: "#ef4444", borderColor: "#ef4444" }}
                onClick={handleRemoveMember}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DELETE ORGANIZATION CONFIRMATION
         ======================================================== */}
      {deleteConfirmOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "440px", textAlign: "center", padding: "26px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <ShieldAlert size={26} />
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#ef4444", marginBottom: "8px" }}>
              Delete Organization Workspace?
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13.5px", lineHeight: "1.5", marginBottom: "20px" }}>
              This will permanently delete <strong>{orgData?.name}</strong>, member rosters, and team analytics. This action cannot be undone.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button type="button" className="btn-outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: "#ef4444", borderColor: "#ef4444" }}
                onClick={handleDeleteOrganization}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
