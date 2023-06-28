import "../styles/globals.css";
// import "prosemirror-suggestcat-plugin/dist/styles/styles.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
