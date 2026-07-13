/**
 * data-layer/topics.js
 * Knows NOTHING about any database provider. Delegates everything to provider.
 */
import { provider } from "../data-provider";

export const getTopics              = ()                    => provider.getTopics();
export const getTopic               = (id)                  => provider.getTopic(id);
export const getTopicsBySubject     = (subjectId)           => provider.getTopicsBySubject(subjectId);
export const createTopic            = (data)                => provider.createTopic(data);
export const updateTopic            = (id, data)            => provider.updateTopic(id, data);
export const deleteTopic            = (id)                  => provider.deleteTopic(id);
export const subscribeTopics        = (cb)                  => provider.subscribeTopics(cb);
export const checkTopicDuplicate    = (name, subjectId)     => provider.checkTopicDuplicate(name, subjectId);
export const deleteTopicCascade     = (id)                  => provider.deleteTopicCascade(id);
