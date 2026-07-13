/**
 * data-layer/questions.js
 * Knows NOTHING about any database provider. Delegates everything to provider.
 */
import { provider } from "../data-provider";

export const getQuestions               = ()                    => provider.getQuestions();
export const getQuestion                = (id)                  => provider.getQuestion(id);
export const getQuestionsByIds          = (ids)                 => provider.getQuestionsByIds(ids);
export const getQuestionsBySubject      = (subject)             => provider.getQuestionsBySubject(subject);
export const getQuestionsBySubjectId    = (subjectId)           => provider.getQuestionsBySubjectId(subjectId);
export const getQuestionsFiltered       = (opts)                => provider.getQuestionsFiltered(opts);
export const createQuestion             = (data)                => provider.createQuestion(data);
export const updateQuestion             = (id, data)            => provider.updateQuestion(id, data);
export const deleteQuestion             = (id)                  => provider.deleteQuestion(id);
export const subscribeQuestions         = (cb)                  => provider.subscribeQuestions(cb);
export const checkQuestionDuplicate     = (text, subTopicId)    => provider.checkQuestionDuplicate(text, subTopicId);
