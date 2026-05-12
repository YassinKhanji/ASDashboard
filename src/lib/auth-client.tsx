// Mock useSession for Avenir Souriant

export const useSession = () => {
  return {
    data: {
      user: {
        id: "admin-id",
        name: "Admin",
        email: "admin@avenirsouriant.ca",
        role: "ADMIN",
      },
    },
    status: "authenticated",
  };
};

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
