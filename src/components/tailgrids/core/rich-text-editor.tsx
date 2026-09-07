"use client";

import { FileImage, Link1AngularRight, Paperclip2, SparkleFill } from "@tailgrids/icons";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { cn } from "@/utils/cn";

import { Button } from "./button";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

interface ToolbarButtonProps {
  active: boolean;
  onPress: () => void;
  label: string;
  children: ReactNode;
}

function ToolbarButton({ active, onPress, label, children }: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="xs"
      iconOnly
      aria-label={label}
      onPress={onPress}
      className={cn(
        "text-sm text-text-secondary",
        active && "bg-background-gray-secondary text-text-primary",
      )}
    >
      {children}
    </Button>
  );
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Nhập nội dung..." }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-28 px-4 py-3 text-sm leading-6 text-text-primary outline-none [&_p]:my-1 [&_a]:text-primary-500 [&_a]:underline",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const handleLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Nhập đường dẫn liên kết", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleUnsupported = () => toast.info("Tính năng này đang được phát triển.");

  return (
    <div className={cn("rounded-lg border border-card-border bg-input-background", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-card-border px-2 py-1.5">
        <ToolbarButton
          label="In đậm"
          active={editor.isActive("bold")}
          onPress={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          label="In nghiêng"
          active={editor.isActive("italic")}
          onPress={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          label="Gạch chân"
          active={editor.isActive("underline")}
          onPress={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton
          label="Gạch ngang"
          active={editor.isActive("strike")}
          onPress={() => editor.chain().focus().toggleStrike().run()}
        >
          <span className="line-through">S</span>
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-card-border" aria-hidden="true" />
        <ToolbarButton label="Chèn liên kết" active={editor.isActive("link")} onPress={handleLink}>
          <Link1AngularRight size={16} />
        </ToolbarButton>
        <ToolbarButton label="Chèn ảnh" active={false} onPress={handleUnsupported}>
          <FileImage size={16} />
        </ToolbarButton>
        <ToolbarButton label="Đính kèm tệp" active={false} onPress={handleUnsupported}>
          <Paperclip2 size={16} />
        </ToolbarButton>
        <ToolbarButton label="Trợ lý AI" active={false} onPress={handleUnsupported}>
          <SparkleFill size={16} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
