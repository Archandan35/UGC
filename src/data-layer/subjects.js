/**
 * data-layer/subjects.js
 * Knows NOTHING about any database provider. Delegates everything to provider.
 */
import { provider } from "../data-provider";

export const getSubjects            = ()            => provider.getSubjects();
export const getSubject             = (id)          => provider.getSubject(id);
export const createSubject          = (data)        => provider.createSubject(data);
export const updateSubject          = (id, data)    => provider.updateSubject(id, data);
export const deleteSubject          = (id)          => provider.deleteSubject(id);
export const subscribeSubjects      = (cb)          => provider.subscribeSubjects(cb);
export const checkSubjectDuplicate  = (name)        => provider.checkSubjectDuplicate(name);
export const deleteSubjectCascade   = (id)          => provider.deleteSubjectCascade(id);
