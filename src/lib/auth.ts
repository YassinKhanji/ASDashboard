// Mock Auth for Avenir Souriant
// Removed login feature to resolve Vercel deployment issues

export const auth = async () => {
  return {
    user: {
      id: "admin-id",
      name: "Admin",
      email: "admin@avenirsouriant.ca",
      role: "ADMIN",
    },
  };
};

export const signIn = async () => {};
export const signOut = async () => {};
export const handlers = {
  GET: () => new Response("Auth removed"),
  POST: () => new Response("Auth removed"),
};
