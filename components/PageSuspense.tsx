import { Suspense } from "react";
import PageSkeleton from "./PageSkeleton";

export default function PageSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}
