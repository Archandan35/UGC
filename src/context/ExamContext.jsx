import { createContext, useContext, useState } from "react";

const ExamContext = createContext(null);

export function ExamProvider({ children }) {
  const [examState, setExamState] = useState({
    examId: null,
    questions: [],
    answers: {},
    marked: {},
    timePerQuestion: {},
    startedAt: null,
  });
  return (
    <ExamContext.Provider value={{ examState, setExamState }}>
      {children}
    </ExamContext.Provider>
  );
}

export function useExamContext() {
  return useContext(ExamContext);
}
