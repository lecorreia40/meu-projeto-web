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
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function AdminUsersPage() {
  const admin = await requirePlatformAdmin();
  const a = getDictionary(await getLocale()).admin;

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
        <h1 className="text-xl font-bold tracking-tight">{a.usersTitle}</h1>
        <p className="text-sm text-slate-500">{a.usersSub}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{a.inviteUser}</CardTitle>
          <CardDescription>{a.inviteSub}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Input name="name" placeholder={a.fullNamePh} required className="lg:col-span-1" />
            <Input name="email" type="email" placeholder={a.emailPh} required className="lg:col-span-2" />
            <Select name="tenantId" required defaultValue="">
              <option value="" disabled>{a.workspacePh}</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Select name="roleId" required defaultValue="">
              <option value="" disabled>{a.rolePh}</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
            <div className="flex gap-2">
              <Input name="password" type="text" placeholder={a.initialPassword} minLength={8} required className="flex-1" />
              <Button type="submit">{a.createBtn}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{a.thNameCol}</TableHead>
                <TableHead>{a.emailPh}</TableHead>
                <TableHead>{a.thWorkspace}</TableHead>
                <TableHead>{a.thRole}</TableHead>
                <TableHead>{a.thStatusCol}</TableHead>
                <TableHead>{a.thCreatedU}</TableHead>
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
                      {user.isPlatformAdmin && <Badge variant="brand" className="ml-2">{a.platform}</Badge>}
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
                          <Button size="sm" variant="ghost" type="submit">{a.saveBtn}</Button>
                        </form>
                      ) : <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={active ? "success" : "danger"}>{active ? a.active : a.disabled}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      {user.id !== admin.id && (
                        <form action={setUserActiveAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="active" value={active ? "false" : "true"} />
                          <Button size="sm" variant={active ? "ghost" : "secondary"} type="submit">
                            {active ? a.disable : a.enable}
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
