"use client";
import { Fragment } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

export interface FileWithPreview extends File {
  preview: string;
}

type ExistingFile = {
  filename: string;
  url?: string; // fallback if not just based on filename
};

const FileUploaderMultiple = ({
  list_header = "",
  multiple = true,
  on_add,
  on_remove,
  on_remove_existing,
  files,
  existing_files = [],
  header,
  sub_header,
  icon,
}: {
  files: FileWithPreview[];
  existing_files?: ExistingFile[];
  on_add: (files: any) => void;
  on_remove: (file: FileWithPreview) => void;
  on_remove_existing?: (filename: string) => void;
  header?: string;
  sub_header?: string;
  icon?: React.ReactNode;
  multiple?: boolean;
  list_header?: string;
}) => {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      on_add(acceptedFiles);
    },
  });

  const renderFilePreview = (file: FileWithPreview | ExistingFile) => {
    if ("name" in file) {
      if (file.type.startsWith("image")) {
        return (
          <Image
            width={48}
            height={48}
            alt={file.name}
            src={URL.createObjectURL(file)}
            className="rounded border p-0.5"
          />
        );
      } else {
        return "Upload";
      }
    } else {
      // existing file (from server)
      const src = file.url || `/uploads/${file.filename}`;
      
      return (
        <Image
          width={48}
          height={48}
          alt={file.filename}
          src={src}
          className="rounded border p-0.5"
        />
      );
    }
  };

  const renderFileSize = (size: number) => {
    const kb = Math.round(size / 100) / 10;
    return kb > 1000 ? `${(kb / 100).toFixed(1)} mb `:` ${kb.toFixed(1)} kb`;
  };

  const fileList = files.map((file) => (
    <div
      key={file.name}
      className="flex justify-between border px-3.5 py-3 my-6 rounded-md"
    >
      <div className="flex gap-3 items-center">
        <div className="file-preview">{renderFilePreview(file)}</div>
        <div>
          <div className="text-sm text-card-foreground">{file.name}</div>
          <div className="text-xs font-light text-muted-foreground">
            {renderFileSize(file.size)}
          </div>
        </div>
      </div>

      <button
        color="destructive"
        className="border-none rounded-full"
        onClick={() => on_remove(file)}
      >
        Upload
      </button>
    </div>
  ));

  const existingFileList = existing_files.map((file) => (
    <div
      key={file.filename}
      className="flex justify-between border px-3.5 py-3 my-6 rounded-md"
    >
      <div className="flex gap-3 items-center">
        <div className="file-preview">{renderFilePreview(file)}</div>
        <div>
          <div className="text-sm text-card-foreground">{file.filename}</div>
          <div className="text-xs font-light text-muted-foreground">Server file</div>
        </div>
      </div>

      {!!on_remove_existing && (
        <button
          color="destructive"
          className="border-none rounded-full"
          onClick={() => on_remove_existing(file.filename)}
        >
            upload
        </button>
      )}
    </div>
  ));

  return (
    <Fragment>
      <div {...getRootProps({ className: "dropzone cursor-pointer" })}>
        <input {...getInputProps()} />
        <div className="w-full text-center border border-dashed mt-5 rounded-md py-3 flex items-center flex-col cursor-pointer">
          <div className="h-12 w-12 inline-flex rounded-md bg-muted items-center justify-center mb-0">
            {!!icon ? icon : "Upload"}
          </div>
          <h4 className="text-2xl font-medium mb-1 text-card-foreground/80">
            {!!header ? header : "Fayllar Yüklə"}
          </h4>
          <div className="text-xs text-muted-foreground">
            ( {!!sub_header ? sub_header : "Faylları sürüşdürün yaxud basaraq əlavə edin"} )
          </div>
        </div>
      </div>

      {!!list_header.length && (files.length || existing_files.length) && (
        <span className="font-medium">{list_header}</span>
      )}

      {existing_files.length > 0 && (
        <div className="m-0 p-0">{existingFileList}</div>
      )}

      {files.length > 0 && <div className="m-0 p-0">{fileList}</div>}
    </Fragment>
  );
};

export default FileUploaderMultiple;