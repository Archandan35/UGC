// Redirect shim — all consumers should migrate to: import { ... } from "../data-layer"
export {
  createQuestion as addQuestion,
  deleteQuestion,
  updateQuestion,
  subscribeQuestions as listenQuestions,
  getQuestionsBySubject,
} from "../data-layer";
