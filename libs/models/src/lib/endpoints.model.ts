export const ENDPOINTS = {
  auth: {
    root: 'auth',
    login: 'login',
    register: 'register',
    logout: 'logout',
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
    userAccountsData: 'user-accounts-data',
    accessManagement: {
      root: 'access-management',
      grantManagementAccess: 'grant-management-access',
      grantReadonlyAccess: 'grant-readonly-access',
      grantCustomAccess: 'grant-custom-access',
      getEntityUsers: 'users/:service/:entityId',
      revokeAgencyAccess: 'revoke/:service/:entityId/:linkId',
      getAvailableServices: 'services'
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
