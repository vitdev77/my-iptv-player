// src/components/uploadDialog.tsx
"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadCloud, FileText, Loader2 } from "lucide-react";

interface UploadDialogProps {
  onUploadSuccess: () => void;
}

export function UploadDialog({ onUploadSuccess }: UploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadToServer = async (fileText: string, name: string) => {
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileText, playlistName: name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка при загрузке на сервер");
      }
      alert(`Успешно импортировано каналов: ${data.count}`);
      onUploadSuccess();
      setIsOpen(false);
    } catch (error: any) {
      alert(error.message || "Не удалось сохранить плейлист");
    } finally {
      setIsUploading(false);
      setFileName(null);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".m3u") && !file.name.endsWith(".m3u8")) {
      alert("Пожалуйста, выберите файл в формате .m3u или .m3u8");
      return;
    }
    setFileName(file.name);
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      await uploadToServer(text, file.name);
    };
    reader.onerror = () => {
      alert("Ошибка при чтении файла в браузере");
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="w-full gap-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer">
        <UploadCloud className="h-4 w-4" />
        Импорт .m3u
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Загрузка IPTV плейлиста</DialogTitle>
          <DialogDescription>
            Перетащите ваш файл плейлиста сюда или выберите его на компьютере.
          </DialogDescription>
        </DialogHeader>
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors ${
            isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/20 hover:border-muted-foreground/40 bg-card"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".m3u,.m3u8"
            className="hidden"
            disabled={isUploading}
            onChange={handleChange}
          />
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium">
                Обработка и запись {fileName} в Neon...
              </p>
            </>
          ) : fileName ? (
            <>
              <FileText className="h-10 w-10 text-primary" />
              <p className="text-sm font-medium truncate max-w-xs">
                {fileName}
              </p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-background border border-border shadow-sm">
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  Кликните или перетащите файл
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Поддерживаются .m3u и .m3u8
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
