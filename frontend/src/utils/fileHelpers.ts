export function formatBytes(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  if (i === 0) return `${bytes} B`;

  const value = bytes / Math.pow(k, i);
  // Avoid trailing zero if whole number (e.g. 1 MB instead of 1.0 MB, but 1.5 MB for decimals)
  const formatted = parseFloat(value.toFixed(1));
  return `${formatted} ${sizes[i]}`;
}

export function getFileCategory(file: { type?: string; name?: string }): 'image' | 'video' | 'file' {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg|avif)$/.test(name)) {
    return 'image';
  }

  if (type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/.test(name)) {
    return 'video';
  }

  return 'file';
}

export function getFileIconName(fileName: string): string {
  const lower = (fileName || '').toLowerCase();

  if (/\.pdf$/.test(lower)) {
    return 'picture_as_pdf';
  }

  if (/\.(zip|tar|gz|7z|rar|bz2|xz)$/.test(lower)) {
    return 'folder_zip';
  }

  if (/\.(mp4|webm|mov|mkv|avi|m4v)$/.test(lower)) {
    return 'video_file';
  }

  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(lower)) {
    return 'audio_file';
  }

  if (/\.(doc|docx|odt|rtf)$/.test(lower)) {
    return 'description';
  }

  if (/\.(xls|xlsx|csv|tsv|ods)$/.test(lower)) {
    return 'table_chart';
  }

  if (/\.(ppt|pptx|key|odp)$/.test(lower)) {
    return 'slideshow';
  }

  if (/\.(txt|md|json|js|ts|tsx|jsx|html|css|py|sh|fish|xml|yaml|yml)$/.test(lower)) {
    return 'text_snippet';
  }

  return 'insert_drive_file';
}
