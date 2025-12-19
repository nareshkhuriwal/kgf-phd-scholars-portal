const ROLE_HIERARCHY = {
  researcher: 1,
  supervisor: 2,
  admin: 3,
  super_admin: 4,
};

export function hasRoleAccess(userRole, requiredRole) {
  if (!userRole || !requiredRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
