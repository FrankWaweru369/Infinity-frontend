import { useEffect, useRef } from "react";
import { useRouter } from "next/router";

let handlers = [];

export const registerBackHandler = (handler, priority = 0) => {
  const item = { handler, priority };

  handlers.push(item);

  handlers.sort((a, b) => b.priority - a.priority);

  return () => {
    handlers = handlers.filter(
      h => h !== item
    );
  };
};


export default function useBackButton() {
  const router = useRouter();
  const lastBackPress = useRef(0);
const backTimer = useRef(null);

  useEffect(() => {

    const handleBack = (event) => {

      // 1. Close modals first
      for (const item of handlers) {

        const handled = item.handler();

        if (handled) {
          event.preventDefault();

          window.history.pushState(
            null,
            "",
            window.location.href
          );

          return;
        }
      }


      // 2. Only dashboard gets exit protection
     if (router.pathname === "/dashboard") {

  event.preventDefault();

  const now = Date.now();

  if (
    lastBackPress.current &&
    now - lastBackPress.current < 2000
  ) {

    // second back press
    clearTimeout(backTimer.current);
    lastBackPress.current = 0;

    window.history.go(-1);
    return;
  }


  // first back press
  lastBackPress.current = now;


  clearTimeout(backTimer.current);

  backTimer.current = setTimeout(() => {
    lastBackPress.current = 0;
  }, 2000);


  window.history.pushState(
    null,
    "",
    window.location.href
  );

  return;
} 


      // 3. Other pages: do nothing
      // Browser handles back naturally

    };


    // Only protect dashboard
    if (router.pathname === "/dashboard") {
      window.history.pushState(
        null,
        "",
        window.location.href
      );
    }


    window.addEventListener(
      "popstate",
      handleBack
    );


    return () => {
      window.removeEventListener(
        "popstate",
        handleBack
      );
    };

  }, [router.pathname]);
}
