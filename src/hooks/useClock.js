import { useEffect, useState } from "react";

const subscribers = new Set();
let timer = null;

function tick() {
  const d = new Date();
  subscribers.forEach((fn) => fn(d));
}

function subscribe(fn) {
  subscribers.add(fn);
  if (!timer) {
    timer = setInterval(tick, 1000);
    setTimeout(tick, 0);
  }
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) {
      clearInterval(timer);
      clearTimeout(timer);
      timer = null;
    }
  };
}

export default function useClock() {
  const [now, setNow] = useState(null);
  useEffect(() => subscribe(setNow), []);
  return now;
}
