/**
 * Zero-dependency client-side ZIP archive builder (PKZIP format).
 * Bundles multi-file workspaces into standard .zip files that can be extracted natively
 * on Windows, macOS, Linux, or opened directly in desktop VS Code.
 */

// Precomputed CRC32 lookup table
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function computeCRC32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipFileEntry {
  path: string; // e.g., "web-app/index.html" or "main.py"
  content: string; // text content
}

export class SimpleZipBuilder {
  private files: Array<{
    nameBytes: Uint8Array;
    contentBytes: Uint8Array;
    crc: number;
    offset: number;
  }> = [];

  public addFile(path: string, content: string) {
    const encoder = new TextEncoder();
    // Normalize path: forward slashes and no leading slash
    const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
    const nameBytes = encoder.encode(cleanPath);
    const contentBytes = encoder.encode(content);
    const crc = computeCRC32(contentBytes);

    this.files.push({
      nameBytes,
      contentBytes,
      crc,
      offset: 0,
    });
  }

  public generateZipBlob(): Blob {
    const parts: Uint8Array[] = [];
    let currentOffset = 0;

    // 1. Write Local File Headers + File Data
    for (const file of this.files) {
      file.offset = currentOffset;

      const header = new Uint8Array(30);
      const view = new DataView(header.buffer);

      view.setUint32(0, 0x04034b50, true); // Local file header signature
      view.setUint16(4, 20, true); // Version needed to extract (2.0)
      view.setUint16(6, 0x0800, true); // General purpose bit flag (UTF-8 filename)
      view.setUint16(8, 0, true); // Compression method (0 = STORE, uncompressed)
      view.setUint16(10, 0, true); // File last mod time
      view.setUint16(12, 0, true); // File last mod date
      view.setUint32(14, file.crc, true); // CRC-32
      view.setUint32(18, file.contentBytes.length, true); // Compressed size
      view.setUint32(22, file.contentBytes.length, true); // Uncompressed size
      view.setUint16(26, file.nameBytes.length, true); // File name length
      view.setUint16(28, 0, true); // Extra field length

      parts.push(header);
      parts.push(file.nameBytes);
      parts.push(file.contentBytes);

      currentOffset += header.length + file.nameBytes.length + file.contentBytes.length;
    }

    const centralDirectoryStartOffset = currentOffset;
    let centralDirectorySize = 0;

    // 2. Write Central Directory Headers
    for (const file of this.files) {
      const cdHeader = new Uint8Array(46);
      const view = new DataView(cdHeader.buffer);

      view.setUint32(0, 0x02014b50, true); // Central directory file header signature
      view.setUint16(4, 20, true); // Version made by
      view.setUint16(6, 20, true); // Version needed to extract
      view.setUint16(8, 0x0800, true); // General purpose bit flag (UTF-8)
      view.setUint16(10, 0, true); // Compression method
      view.setUint16(12, 0, true); // File last mod time
      view.setUint16(14, 0, true); // File last mod date
      view.setUint32(16, file.crc, true); // CRC-32
      view.setUint32(20, file.contentBytes.length, true); // Compressed size
      view.setUint32(24, file.contentBytes.length, true); // Uncompressed size
      view.setUint16(28, file.nameBytes.length, true); // File name length
      view.setUint16(30, 0, true); // Extra field length
      view.setUint16(32, 0, true); // File comment length
      view.setUint16(34, 0, true); // Disk number start
      view.setUint16(36, 0, true); // Internal file attributes
      view.setUint32(38, 0, true); // External file attributes
      view.setUint32(42, file.offset, true); // Relative offset of local header

      parts.push(cdHeader);
      parts.push(file.nameBytes);

      const cdEntrySize = cdHeader.length + file.nameBytes.length;
      centralDirectorySize += cdEntrySize;
      currentOffset += cdEntrySize;
    }

    // 3. Write End of Central Directory Record (EOCD)
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);

    eocdView.setUint32(0, 0x06054b50, true); // End of central dir signature
    eocdView.setUint16(4, 0, true); // Number of this disk
    eocdView.setUint16(6, 0, true); // Disk with central directory
    eocdView.setUint16(8, this.files.length, true); // Total entries in central dir on this disk
    eocdView.setUint16(10, this.files.length, true); // Total entries in central dir
    eocdView.setUint32(12, centralDirectorySize, true); // Size of central directory
    eocdView.setUint32(16, centralDirectoryStartOffset, true); // Offset of start of central directory
    eocdView.setUint16(20, 0, true); // Comment length

    parts.push(eocd);

    return new Blob(parts, { type: 'application/zip' });
  }
}

/**
 * Triggers a browser download of a ZIP file containing all workspace files.
 */
export function downloadWorkspaceAsZip(
  files: Array<{ name: string; content: string; folderId?: string | null }>,
  folders: Array<{ id: string; name: string }>,
  projectName: string = 'nextera-workspace'
) {
  const zip = new SimpleZipBuilder();

  // Create README.md
  const readmeContent = `# ${projectName}\n\nExported from **NextEra Coders Learning Platform** (NEC Compiler Pro).\n\n## Included Files:\n${files
    .map((f) => {
      const folder = f.folderId ? folders.find((fol) => fol.id === f.folderId)?.name : null;
      return `- ${folder ? `${folder}/` : ''}${f.name}`;
    })
    .join('\n')}\n\n⚡ Visit https://nexteracoders.com to learn, code, and build live production apps.\n`;

  zip.addFile('README.md', readmeContent);

  // Add all files with appropriate folder paths
  for (const file of files) {
    const folder = file.folderId ? folders.find((fol) => fol.id === file.folderId)?.name : null;
    const fullPath = folder ? `${folder}/${file.name}` : file.name;
    zip.addFile(fullPath, file.content || '');
  }

  const blob = zip.generateZipBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
