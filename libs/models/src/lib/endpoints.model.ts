export const ENDPOINTS = {
  auth: {
    root: 'auth',
    login: 'login',
    register: 'register',
    logout: 'logout',
    updateEmail: 'update-email',
    google: {
      root: 'google',
      callback: 'google/callback'
    },
    facebook: {
      root: 'facebook',
      callback: 'facebook/callback'
    }
  },
  google: {
    root: 'google',
    connect: 'connect',
    accessManagement: {
      root: 'access-management',
      grantManagementAccess: 'grant-management-access',
      grantReadonlyAccess: 'grant-readonly-access',
      getEntityUsers: 'users/:service/:entityId',
      revokeAgencyAccess: 'revoke/:service/:entityId/:linkId'
    }
  },
  users: {
    root: 'users',
    profile: 'profile',
    getOne: ':id',
    editOne: ':id',
    deleteOne: ':id'
  },
  agencies: {
    root: 'agencies',
    getOne: ':id',
    editOne: ':id',
    deleteOne: ':id'
  }
};

export const PREFIX = 'api';
