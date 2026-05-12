import React from "react";
import { listAdminUsers, listTeams } from "./actions";
import AdminsClient from "./AdminsClient";

export const metadata = { title: "Manage Admins | ZVA System" };
export const revalidate = 0;

export default async function AdminsPage() {
  const [admins, teams] = await Promise.all([listAdminUsers(), listTeams()]);
  return <AdminsClient admins={admins} teams={teams} />;
}
