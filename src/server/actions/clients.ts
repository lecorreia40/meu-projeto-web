"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/permissions";

const clientSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  countryOfResidence: z.string().optional(),
});

export async function createClientAction(formData: FormData) {
  const user = await requirePermission("client.create");
  const parsed = clientSchema.parse({
    fullName: formData.get("fullName"),
    email: formData.get("email") ?? "",
    phone: (formData.get("phone") as string) || undefined,
    nationality: (formData.get("nationality") as string) || undefined,
    countryOfResidence: (formData.get("countryOfResidence") as string) || undefined,
  });

  const client = await db.client.create({
    data: {
      tenantId: user.tenantId!,
      fullName: parsed.fullName,
      email: parsed.email || null,
      phone: parsed.phone,
      nationality: parsed.nationality,
      countryOfResidence: parsed.countryOfResidence,
      profile: { create: { data: {} } },
    },
  });

  await writeAudit({
    tenantId: user.tenantId,
    actorId: user.id,
    action: "client.create",
    entity: "Client",
    entityId: client.id,
  });
  revalidatePath("/firm/clients");
}
