import { db } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/permissions";
import { createUserAction, setUserActiveAction, changeUserRoleAction } from "@/server/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const admin = await requirePlatformAdmin();

  const [users, tenants, roles] = await Promise.all([
    db.user.findMany({
      include: {
        memberships: { include: { role: true, tenant: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.tenant.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-slate-500">Manage accounts across every workspace. All actions are audited.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite a user</CardTitle>
          <CardDescription>Set an initial password and ask the person to change it after first sign-in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Input name="name" placeholder="Full name" required className="lg:col-span-1" />
            <Input name="email" type="email" placeholder="Email" required className="lg:col-span-2" />
            <Select name="tenantId" required defaultValue="">
              <option value="" disabled>Workspace…</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Select name="roleId" required defaultValue="">
              <option value="" disabled>Role…</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
            <div className="flex gap-2">
              <Input name="password" type="text" placeholder="Initial password" minLength={8} required className="flex-1" />
              <Button type="submit">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const membership = user.memberships[0];
                const active = user.deletedAt === null;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                      {user.isPlatformAdmin && <Badge variant="brand" className="ml-2">Platform</Badge>}
                    </TableCell>
                    <TableCell className="text-slate-500">{user.email}</TableCell>
                    <TableCell className="text-slate-500">{membership?.tenant.name ?? "-"}</TableCell>
                    <TableCell>
                      {membership ? (
                        <form action={changeUserRoleAction} className="flex items-center gap-1">
                          <input type="hidden" name="membershipId" value={membership.id} />
                          <Select name="roleId" defaultValue={membership.roleId} className="h-7 w-40 text-xs">
                            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </Select>
                          <Button size="sm" variant="ghost" type="submit">Save</Button>
                        </form>
                      ) : <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={active ? "success" : "danger"}>{active ? "Active" : "Disabled"}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      {user.id !== admin.id && (
                        <form action={setUserActiveAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="active" value={active ? "false" : "true"} />
                          <Button size="sm" variant={active ? "ghost" : "secondary"} type="submit">
                            {active ? "Disable" : "Enable"}
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
