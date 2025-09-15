"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-md-editor").then((mod: any) => mod.default.Markdown),
  { ssr: false }
);

type Props = { source?: string; className?: string };

export default function MarkdownContent({ source = "", className = "" }: Props) {
  return (
    <div className={`max-w-none ${className}`} data-color-mode="light">
      <MarkdownPreview source={source} />
    </div>
  );
}

