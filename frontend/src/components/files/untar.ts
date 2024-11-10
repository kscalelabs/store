import pako from "pako";

export interface UntarredFile {
  name: string;
  content: Uint8Array;
}

export const parseTar = (buffer: Uint8Array): UntarredFile[] => {
  const files: UntarredFile[] = [];
  let offset = 0;
  let longFileName = "";

  const readString = (view: Uint8Array, start: number, length: number) => {
    return new TextDecoder()
      .decode(view.slice(start, start + length))
      .replace(/\0/g, "");
  };

  while (offset < buffer.length - 512) {
    const header = buffer.slice(offset, offset + 512);
    let fileName = readString(header, 0, 100).trim();

    // Check for GNU tar long filename
    if (fileName === "././@LongLink") {
      offset += 512;
      const sizeBuf = readString(header, 124, 12);
      const size = parseInt(sizeBuf, 8);
      longFileName = readString(
        buffer.slice(offset, offset + size),
        0,
        size,
      ).trim();
      offset += Math.ceil(size / 512) * 512;
      continue;
    }

    if (longFileName) {
      fileName = longFileName;
      longFileName = "";
    }

    const sizeBuf = readString(header, 124, 12);
    const size = parseInt(sizeBuf, 8);

    if (fileName === "" || size === 0) {
      break; // End of archive
    }

    offset += 512; // Move past the header

    // Skip PaxHeader entries
    if (!fileName.includes("PaxHeader") && !fileName.endsWith("/")) {
      const content = buffer.slice(offset, offset + size);
      files.push({ name: fileName, content });
    }

    // Move to the next 512-byte boundary
    offset += Math.ceil(size / 512) * 512;
  }

  return files;
};

export const untarFile = async (url: string) => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const decompressed = pako.ungzip(uint8Array);
  const files = parseTar(decompressed);
  return files;
};

export const cleanXml = (xml: string) => {
  xml = xml.replace(/<\?xml version="1.0" encoding="UTF-8"\?>/, "");
  xml = xml.replace(/\n/g, "");
  return xml;
};
