import { SkeletonRows } from "@/components/Skeleton";

export default function Loading() {
  return <SkeletonRows count={5} label="Loading admin" />;
}
