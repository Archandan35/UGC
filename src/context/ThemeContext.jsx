import { createContext, useContext, useEffect, useState } from "react";
import { useAppStore } from "../store/appStore";

const ThemeContext = createContext({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }) {
  const theme = useAppStore((s) => s.theme || "light");
  const setTheme = useAppStore((s) => s.setTheme);
  const [t, setT] = useState(theme);

  useEffect(() => {
    document.documentElement.dataset.theme = t;
  }, [t]);

  const toggle = () => {
    const next = t === "light" ? "dark" : "light";
    setT(next);
    setTheme?.(next);
  };

  return (
    <ThemeContext.Provider value={{ theme: t, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
