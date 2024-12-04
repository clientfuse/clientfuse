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
  user: {
    root: 'user',
    profile: 'profile',
    getUsers: 'get-users'
  }
};

export const PREFIX = 'api';
