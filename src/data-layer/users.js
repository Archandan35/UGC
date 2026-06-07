/**
 * data-layer/users.js
 * Knows NOTHING about any database provider. Delegates everything to provider.
 */
import { provider } from "../data-provider";

export const getUsers               = ()            => provider.getUsers();
export const getUser                = (id)          => provider.getUser(id);
export const getUserByUid           = (uid)         => provider.getUserByUid(uid);
export const getUserByEmail         = (email)       => provider.getUserByEmail(email);
export const getUsersByUids         = (uids)        => provider.getUsersByUids(uids);
export const getUsersByPhone        = (variants)    => provider.getUsersByPhone(variants);
export const createUser             = (data)        => provider.createUser(data);
export const createUserWithId       = (id, data)    => provider.createUserWithId(id, data);
export const updateUser             = (id, data)    => provider.updateUser(id, data);
export const deleteUser             = (id)          => provider.deleteUser(id);
export const subscribeUsers         = (cb)          => provider.subscribeUsers(cb);
export const subscribeUserByUid     = (uid, cb)     => provider.subscribeUserByUid(uid, cb);
export const markUserOnline         = (docId)       => provider.markUserOnline(docId);
export const markUserOffline        = (docId)       => provider.markUserOffline(docId);
export const getSubscription        = (uid)         => provider.getSubscription(uid);
export const subscribeSubscription  = (uid, cb)     => provider.subscribeSubscription(uid, cb);
export const deleteUserCompletely   = (user)        => provider.deleteUserCompletely(user);
