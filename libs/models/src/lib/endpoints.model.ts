export const ENDPOINTS = {
  connectionLinks: {
    root: 'connection-links',
    getOne: ':id',
    editOne: ':id',
    deleteOne: ':id',
    defaultByAgency: 'default/:agencyId',
    setDefault: ':id/set-default'
  },
  connectionResults: {
    root: 'connection-results',
    one: 'one',
    getOne: ':id',
    editOne: ':id',
    deleteOne: ':id',
    byAgency: 'agency/:agencyId'
  },
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
    connectExternal: 'connect-external',
    connectInternal: 'connect-internal',
    disconnectInternal: 'disconnect-internal',
    accessManagement: {
      root: 'access-management',
      grantManagementAccess: 'grant-management-access',
      grantViewAccess: 'grant-view-access',
      getEntityUsers: 'users/:service/:entityId',
      revokeAgencyAccess: 'revoke/:service/:entityId/:linkId'
    }
  },
  facebook: {
    root: 'facebook',
    connectExternal: 'connect-external',
    connectInternal: 'connect-internal',
    disconnectInternal: 'disconnect-internal',
    accessManagement: {
      root: 'access-management',
      grantManagementAccess: 'grant-management-access',
      grantViewAccess: 'grant-view-access',
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
    deleteOne: ':id',
    uploadLogo: ':id/upload-logo',
    deleteLogo: ':id/delete-logo',
  },
  billing: {
    root: 'billing',
    checkoutSession: 'checkout-session',
    portalSession: 'portal-session',
    webhook: 'webhook',
    subscription: 'subscription',
    plans: 'plans',
    usage: 'usage',
    invoices: 'invoices'
  }
};

export const PREFIX = 'api';
