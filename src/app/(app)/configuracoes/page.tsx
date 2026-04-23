import { requireWedding } from "@/lib/wedding";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const wedding = await requireWedding();
  return <SettingsForm wedding={wedding} />;
}
