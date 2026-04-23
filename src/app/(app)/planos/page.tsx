import { requireWedding } from "@/lib/wedding";
import { PlansClient } from "./plans-client";

export default async function PlansPage() {
  const wedding = await requireWedding();
  return <PlansClient wedding={wedding} />;
}
