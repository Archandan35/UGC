/**
 * data-layer/subtopics.js
 * Knows NOTHING about any database provider. Delegates everything to provider.
 */
import { provider } from "../data-provider";

export const getSubtopics               = ()                          => provider.getSubtopics();
export const getSubtopic                = (id)                        => provider.getSubtopic(id);
export const getSubtopicsByTopic        = (topicId)                   => provider.getSubtopicsByTopic(topicId);
export const createSubtopic             = (data)                      => provider.createSubtopic(data);
export const updateSubtopic             = (id, data)                  => provider.updateSubtopic(id, data);
export const deleteSubtopic             = (id)                        => provider.deleteSubtopic(id);
export const subscribeSubtopics         = (cb)                        => provider.subscribeSubtopics(cb);
export const checkSubtopicDuplicate     = (name, subjectId, topicId)  => provider.checkSubtopicDuplicate(name, subjectId, topicId);
export const deleteSubtopicCascade      = (id)                        => provider.deleteSubtopicCascade(id);
