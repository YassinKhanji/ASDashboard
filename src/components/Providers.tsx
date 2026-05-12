"use client";

import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // SessionProvider removed as authentication is mocked
  return <>{children}</>;
}
