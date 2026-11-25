import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./db";

async function seedUser(params: {
  email: string;
  name: string;
  plainPassword: string;
  role: "MEMBER" | "ATHLETE" | "COACH" | "ADMIN";
}) {
  const existing = await db.orm.public.User
    .whereUnique({ email: params.email })
    .first();

  if (existing) {
    console.log(
      "Utilisateur déjà présent :",
      existing.email,
      "Rôle :",
      existing.role
    );
    return existing;
  }

  const passwordHash = await bcrypt.hash(params.plainPassword, 10);

  const created = await db.orm.public.User.create({
    email: params.email,
    name: params.name,
    passwordHash,
    role: params.role,
  });

  console.log("Utilisateur créé :", {
    id: created.id,
    email: created.email,
    role: created.role,
  });

  return created;
}

async function main() {
  await seedUser({
    email: "athlete@test.com",
    name: "Test Athlete",
    plainPassword: "Password123!",
    role: "ATHLETE",
  });

  await seedUser({
    email: "coach@test.com",
    name: "Test Coach",
    plainPassword: "Password123!",
    role: "COACH",
  });
}

main()
  .catch((err) => {
    console.error("Erreur création utilisateur :", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });