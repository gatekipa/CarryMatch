import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { BackToDashboardLink } from "@/features/cml-core/components/BackToDashboardLink";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import {
  listVendorStaff,
  inviteStaffMember,
  updateStaffRole,
  removeStaffMember,
} from "@/features/cml-core/api/cmlStaff";
import { canManageStaff } from "@/features/cml-core/lib/permissions";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

const ROLE_BADGE_CLASSES = {
  owner: "bg-slate-900 text-white border-slate-900",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  staff: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_BADGE_CLASSES = {
  active: "bg-green-100 text-green-800 border-green-200",
  invited: "bg-amber-100 text-amber-800 border-amber-200",
  inactive: "bg-red-100 text-red-800 border-red-200",
};

export default function StaffManagementPage() {
  const { t } = useI18n();
  const { vendor, vendorStaff: currentUserStaff } = useAuth();

  const staffRole = currentUserStaff?.role ?? "staff";
  const hasPermission = canManageStaff(staffRole);

  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);

  const vendorId = vendor?.id;

  const loadStaff = useCallback(async () => {
    if (!vendorId) return;
    setIsLoading(true);
    try {
      const data = await listVendorStaff(vendorId);
      setStaffList(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteRole) return;
    setIsInviting(true);
    try {
      await inviteStaffMember(vendorId, {
        email: inviteEmail,
        fullName: inviteName,
        role: inviteRole,
      });
      toast.success(t("staff.inviteSuccess"));
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("");
      await loadStaff();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (staffId, newRole) => {
    try {
      await updateStaffRole(vendorId, staffId, newRole);
      toast.success(t("staff.roleUpdated"));
      await loadStaff();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await removeStaffMember(vendorId, removeTarget);
      toast.success(t("staff.removed"));
      setRemoveTarget(null);
      await loadStaff();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getRoleLabel = (role) => {
    if (role === "owner") return t("staff.roleOwner");
    if (role === "admin") return t("staff.roleAdmin");
    return t("staff.roleStaff");
  };

  const getStatusLabel = (status) => {
    if (status === "active") return t("staff.statusActive");
    if (status === "invited") return t("staff.statusInvited");
    return t("staff.statusInactive");
  };

  if (!hasPermission) {
    return (
      <div className="flex flex-col gap-4">
        <BackToDashboardLink />
        <InlineNotice
          title={t("staff.title")}
          description={t("errors.noPermission")}
          tone="warning"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <BackToDashboardLink />

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{t("staff.title")}</CardTitle>
            <CardDescription>{t("staff.description")}</CardDescription>
          </div>

          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                {t("staff.inviteButton")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("staff.inviteTitle")}</DialogTitle>
                <DialogDescription>{t("staff.inviteDescription")}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="invite-email">{t("staff.emailLabel")}</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder={t("staff.emailPlaceholder")}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="invite-name">{t("staff.nameLabel")}</Label>
                  <Input
                    id="invite-name"
                    placeholder={t("staff.namePlaceholder")}
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{t("staff.roleLabel")}</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("staff.rolePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t("staff.roleAdmin")}</SelectItem>
                      <SelectItem value="staff">{t("staff.roleStaff")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleInvite}
                  disabled={isInviting || !inviteEmail.trim() || !inviteRole}
                >
                  {isInviting ? t("common.saving") : t("staff.inviteButton")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <SkeletonTable columns={5} rows={3} />
          ) : staffList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="text-lg font-semibold text-slate-700">{t("staff.emptyTitle")}</p>
              <p className="text-sm text-slate-500">{t("staff.emptyDescription")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("staff.columns.name")}</TableHead>
                    <TableHead>{t("staff.columns.email")}</TableHead>
                    <TableHead>{t("staff.columns.role")}</TableHead>
                    <TableHead>{t("staff.columns.status")}</TableHead>
                    <TableHead className="text-right">{t("staff.columns.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList
                    .filter((s) => s.status !== "inactive")
                    .map((member) => {
                      const isOwner = member.role === "owner";
                      const isCurrentUser = member.id === currentUserStaff?.id;

                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.full_name || "-"}
                            {isCurrentUser && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-[10px]"
                              >
                                {t("staff.ownerBadge")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600">{member.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={ROLE_BADGE_CLASSES[member.role] || ROLE_BADGE_CLASSES.staff}
                            >
                              {getRoleLabel(member.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={STATUS_BADGE_CLASSES[member.status] || STATUS_BADGE_CLASSES.inactive}
                            >
                              {getStatusLabel(member.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {!isOwner && (
                              <div className="flex items-center justify-end gap-2">
                                <Select
                                  value={member.role}
                                  onValueChange={(val) => handleRoleChange(member.id, val)}
                                >
                                  <SelectTrigger className="h-8 w-28 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">{t("staff.roleAdmin")}</SelectItem>
                                    <SelectItem value="staff">{t("staff.roleStaff")}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setRemoveTarget(member.id)}
                                >
                                  {t("staff.remove")}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove confirmation dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("staff.remove")}</AlertDialogTitle>
            <AlertDialogDescription>{t("staff.removeConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>{t("staff.remove")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
