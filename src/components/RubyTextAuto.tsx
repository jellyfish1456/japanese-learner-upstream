import { useState, useEffect } from "react";
import { loadFuriganaMap, getFuriganaHtmlAuto, isFuriganaReady } from "../lib/furigana";

interface Props {
  text: string;
  className?: string;
}

/**
 * Like RubyText but works on arbitrary Japanese text — uses a greedy
 * longest-match scan against the extracted word dictionary instead of
 * requiring an exact key in the furigana map.
 */
export default function RubyTextAuto({ text, className }: Props) {
  const [ready, setReady] = useState(isFuriganaReady());

  useEffect(() => {
    if (!ready) {
      loadFuriganaMap().then(() => setReady(true));
    }
  }, [ready]);

  if (!ready) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: getFuriganaHtmlAuto(text) }}
    />
  );
}
