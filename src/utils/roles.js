export const ADMIN_ROLES = ['admin', 'superuser'];

export const isAdminRole = (role) =>
  ADMIN_ROLES.includes(String(role).toLowerCase());
