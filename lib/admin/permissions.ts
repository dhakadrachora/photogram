import { AdminRole } from './types';

export interface Permissions {
  canDelete: boolean;
  canPublish: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canUploadStorage: boolean;
  canDeleteStorage: boolean;
  canViewSecurity: boolean;
}

export function getRolePermissions(role: AdminRole): Permissions {
  switch (role) {
    case 'owner':
      return {
        canDelete: true,
        canPublish: true,
        canManageUsers: true,
        canManageSettings: true,
        canUploadStorage: true,
        canDeleteStorage: true,
        canViewSecurity: true,
      };
    case 'superadmin':
    case 'admin':
      return {
        canDelete: true,
        canPublish: true,
        canManageUsers: true,
        canManageSettings: false,
        canUploadStorage: true,
        canDeleteStorage: false,
        canViewSecurity: false,
      };
    case 'moderator':
      return {
        canDelete: false,
        canPublish: true,
        canManageUsers: false,
        canManageSettings: false,
        canUploadStorage: true,
        canDeleteStorage: false,
        canViewSecurity: false,
      };
    default:
      return {
        canDelete: false,
        canPublish: false,
        canManageUsers: false,
        canManageSettings: false,
        canUploadStorage: false,
        canDeleteStorage: false,
        canViewSecurity: false,
      };
  }
}
