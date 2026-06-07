import { useState } from "react";
import ExamPageDesktop from "./ExamPageDesktop";
import ExamPagePhone   from "./ExamPagePhone";

/**
 * ExamPage — detects mobile UA and renders the correct exam layout.
 * Same logic as old ExamPage.jsx.
 */
export default function ExamPage() {
  const [isMobile] = useState(
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );

  return isMobile ? <ExamPagePhone /> : <ExamPageDesktop />;
}
