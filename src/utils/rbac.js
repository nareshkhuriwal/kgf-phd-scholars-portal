const ROLE_HIERARCHY = {
  researcher: 1,
  supervisor: 2,
  admin: 3,
  superuser: 4, // Changed from super_admin
};

export function hasRoleAccess(userRole, requiredRole) {
  if (!userRole || !requiredRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}