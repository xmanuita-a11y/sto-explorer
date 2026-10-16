/* Offline STO v3 reader. No network, simulator or file-writing API. */
const StoReader = (() => {
  const fromHex = text => Uint8Array.from(text.match(/../g), x => parseInt(x, 16));
  const hex = bytes => Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('');
  // WebCrypto removes PKCS#7 automatically. Append one synthetic CBC block
  // containing padding so raw decryption preserves every original byte.
  async function rawCBC(bytes, keyBytes) {
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-CBC', false, ['encrypt', 'decrypt']);
    const paddingBlock = new Uint8Array(await crypto.subtle.encrypt({name:'AES-CBC', iv:bytes.slice(-16)}, key, new Uint8Array()));
    const extended = new Uint8Array(bytes.length + 16);
    extended.set(bytes); extended.set(paddingBlock, bytes.length);
    return new Uint8Array(await crypto.subtle.decrypt({name:'AES-CBC', iv:new Uint8Array(16)}, key, extended));
  }
  function canonicalDecimal(value) {
    let sign = '';
    if (/^[+-]/.test(value)) { sign = value[0] === '-' ? '-' : ''; value = value.slice(1); }
    let [whole, fraction = ''] = value.split('.');
    whole = (whole || '0').replace(/^0+(?=\d)/, ''); fraction = fraction.replace(/0+$/, '');
    if (whole === '0' && !fraction) sign = '';
    return sign + whole + (fraction ? '.' + fraction : '');
  }
  function parse(text) {
    const entries = [], unparsed = [], counts = new Map();
    text.split(/\r?\n/).forEach((line, index) => {
      const match = line.match(/^\s*([-+]?(?:\d+(?:\.\d*)?|\.\d+))\s+([A-Za-z_][A-Za-z_0-9]*)\s+!\s*$/);
      if (match) {
        const occurrence = (counts.get(match[2]) || 0) + 1; counts.set(match[2], occurrence);
        entries.push({name:match[2], occurrence, id:match[2]+'#'+occurrence, value:match[1], line:index+1});
      } else if (line.trim() && !line.trim().startsWith('//')) unparsed.push({line:index+1, text:line});
    });
    const car = text.match(/<c>(.*?)<\/c>/)?.[1];
    if (!car || !entries.length) throw new Error('Contenuto senza modello auto o parametri riconoscibili.');
    return {car, contentVersion:text.match(/<v>(.*?)<\/v>/)?.[1] || '', entries, unparsed};
  }
  async function decode(buffer, material) {
    if (!globalThis.crypto?.subtle) throw new Error('Questo browser non rende disponibile WebCrypto. Aprire il file con una versione recente di Edge, Chrome o Firefox.');
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 48 || bytes.length > 16*1024*1024) throw new Error('Dimensione file non supportata (da 48 byte a 16 MiB).');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const version=view.getUint32(0,true), total=view.getUint32(4,true), bodySize=view.getUint32(8,true), notesSize=view.getUint32(12,true);
    if (version !== 3) throw new Error('Versione STO '+version+' non supportata: questa versione legge STO v3.');
    if (!bodySize || bodySize%16 || total!==40+bodySize+notesSize || 8+total>bytes.length || notesSize%2) throw new Error('Intestazione o lunghezze del file non valide.');
    const outer = await rawCBC(bytes.slice(48,48+bodySize), fromHex(material.key));
    const padded = await rawCBC(outer, bytes.slice(16,48));
    const pad=padded.at(-1);
    if (pad<1 || pad>16 || !padded.slice(-pad).every(x=>x===pad)) throw new Error('Decodifica non riuscita: padding non valido. File danneggiato o variante non supportata.');
    const raw = padded.slice(0,-pad);
    if (raw.at(-1)!==0) throw new Error('Terminatore del contenuto non valido.');
    const table=fromHex(material.table), decoded=raw.slice(0,-1).map(x=>(table[x]^218)&127);
    if (!decoded.every(x=>[9,10,13].includes(x) || (x>=32 && x<127))) throw new Error('Il contenuto decodificato non e testo supportato.');
    const text=new TextDecoder('ascii').decode(decoded);
    const notes=new TextDecoder('utf-16le',{fatal:true}).decode(bytes.slice(48+bodySize,48+bodySize+notesSize)).replace(/\0+$/, '');
    return {...parse(text), text, notes, version, tailSize:bytes.length-(8+total), tailSha256:hex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.slice(8+total)))), sha256:hex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))), decodedSha256:hex(new Uint8Array(await crypto.subtle.digest('SHA-256', decoded)))};
  }
  function compare(a,b) {
    const left=new Map(a.entries.map(x=>[x.id,x])), right=new Map((b?.entries || []).map(x=>[x.id,x]));
    return [...new Set([...left.keys(),...right.keys()])].map(id=>{
      const x=left.get(id), y=right.get(id);
      return {id, name:(x||y).name, occurrence:(x||y).occurrence, a:x, b:y, status:!b?'single':!x?'only-b':!y?'only-a':canonicalDecimal(x.value)===canonicalDecimal(y.value)?'same':'changed'};
    });
  }
  return {decode, parse, compare, canonicalDecimal};
})();
if (typeof module !== 'undefined') module.exports = StoReader;
