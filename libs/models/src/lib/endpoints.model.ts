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
    userAccountsData: 'user-accounts-data'
  },
  users: {
    root: 'users',
    profile: 'profile',
    getUsers: 'get-users'
  }
};

export const PREFIX = 'api';
