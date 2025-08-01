import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Check for saved dark mode preference or default to true
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDark = savedDarkMode ? savedDarkMode === 'true' : true;
    
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return <Component {...pageProps} />;
}
