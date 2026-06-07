/**
 * data-layer/auth.js
 *
 * Authentication business layer.
 * Knows NOTHING about any database provider.
 * Delegates everything to provider via data-provider.
 */
import { provider } from "../data-provider";

export const registerEmail                  = (email, pw)  => provider.registerEmail(email, pw);
export const loginEmail                     = (email, pw)  => provider.loginEmail(email, pw);
export const loginGoogle                    = ()           => provider.loginGoogle();
export const resetPassword                  = (email)      => provider.resetPassword(email);
export const logout                         = ()           => provider.logout();
export const setDisplayName                 = (name)       => provider.setDisplayName(name);
export const subscribeAuthState             = (cb)         => provider.subscribeAuthState(cb);
export const getCurrentUser                 = ()           => provider.getCurrentUser();
export const getCurrentUid                  = ()           => provider.getCurrentUid();
export const getAuth                        = ()           => provider.getAuth();
export const getSecondaryAuth               = ()           => provider.getSecondaryAuth();
export const updatePassword                 = (user, pw)   => provider.updatePassword(user, pw);

/** Delete auth user — provider-agnostic name (was: deleteFirebaseAuthUser) */
export const deleteAuthUser                 = (user)       => provider.deleteAuthUser(user);

/** @deprecated Use deleteAuthUser instead */
export const deleteFirebaseAuthUser = deleteAuthUser; // kept for back-compat only

export const reauthenticateWithCredential   = (...a)       => provider.reauthenticateWithCredential(...a);
export const EmailAuthProvider              = provider.EmailAuthProvider;
export const createUserWithEmailAndPassword = (email, pw)  => provider.createUserWithEmailAndPassword(email, pw);
export const sendPasswordResetEmail         = (email)      => provider.sendPasswordResetEmail(email);
export const signOutAuth                    = ()           => provider.signOutAuth();
