'use client';
import { useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const FileUploader = () => {
  const [selectedFiles, setSelectedFile] = useState<FileList | null>(null);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const files: FileList | null = event.target.files ?? null;
    setSelectedFile(files);
  };

  const onFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      console.error('No files selected');
      return;
    }

    const formData = new FormData();

    Array.from(selectedFiles).forEach((file) => {
      formData.append('files', file);
    });

    await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
  };

  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer">Upload</DialogTrigger>
      <DialogContent
        className="
          bg-card
          text-card-foreground
          border
          border-border
          shadow-lg
          rounded-xl
          neon-shadow-hover
        "
      >
        <DialogHeader>
          <DialogTitle className="text-xl neon-underline">Upload</DialogTitle>
        </DialogHeader>
        <DialogDescription>Please upload one or more images</DialogDescription>
        <div className="bg-background p-4 flex flex-col gap-4 text-muted-foreground">
          <Field className="flex flex-col gap-2 rounded-lg border border-border p-4 bg-background/50">
            <FieldLabel
              htmlFor="image-upload-input"
              aria-live="polite"
              className="
                inline-flex
                items-center
                justify-center
                w-full
                truncate
                rounded-md
                bg-secondary
                px-4
                py-2
                text-secondary-foreground
                cursor-pointer
                neon-shadow-hover
                "
            >
              {selectedFiles
                ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
                : 'Select files to upload'}
            </FieldLabel>
            <Input
              type="file"
              id="image-upload-input"
              onChange={onFileChange}
              className="file:mr-4 file:rounded-md file:border-0
              file:bg-secondary file:text-secondary-foreground
              hover:file:bg-accent
              file:px-4 file:py-2
              cursor-pointer
              hidden
              "
              multiple
            />
          </Field>
          <Button
            disabled={!selectedFiles}
            onClick={onFileUpload}
            className={cn(
              'neon-shadow-hover',
              selectedFiles
                ? 'cursor-pointer'
                : 'opacity-50 cursor-not-allowed',
            )}
          >
            Confirm Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploader;
