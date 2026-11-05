/* Public regression suite: no private corpus, network, browser or simulator. */
const assert=require('node:assert/strict'),{webcrypto,createHash}=require('node:crypto');
globalThis.crypto=webcrypto;
const reader=require('./sto-reader-core.js'),{fixture}=require('./sto-test-fixtures.cjs'),material=require('./sto-reader-material.json');
async function main(){
  let count=0;
  for(let paddingBoundary=0;paddingBoundary<64;paddingBoundary++){
    const original=fixture({text:'// <c>synthetic</c>\n// '+'x'.repeat(paddingBoundary)+'\n-0.000 x !\n+0001.2500 x !\n9007199254740993 precise !\n.5 fraction !\n3. left !\nunknown preserved line\n',notes:'Synthetic — note 日本語',tail:Buffer.from([1,2,3,0,255]),seed:paddingBoundary});
    const before=createHash('sha256').update(original.bytes).digest('hex');
    const decoded=await reader.decode(original.bytes,material);
    assert.equal(decoded.text,original.text);assert.equal(decoded.notes,original.notes);assert.equal(decoded.entries.length,5);
    assert.equal(decoded.entries[1].occurrence,2);assert.equal(decoded.unparsed.length,1);assert.equal(decoded.car,'synthetic');
    assert.equal(decoded.tailSize,5);assert.equal(decoded.tailSha256,createHash('sha256').update(original.tail).digest('hex'));
    assert.equal(decoded.sha256,before);assert.equal(createHash('sha256').update(original.bytes).digest('hex'),before);count++;
  }
  const valid=fixture().bytes;
  await assert.rejects(reader.decode(valid.subarray(0,20),material),/Dimensione/);
  for(const version of [0,1,2,4,0xffffffff]){const b=Buffer.from(valid);b.writeUInt32LE(version);await assert.rejects(reader.decode(b,material),/Versione/);}
  for(const [offset,value] of [[4,0],[8,0],[8,15],[8,0xffffffff],[12,1],[12,0xffffffff]]){const b=Buffer.from(valid);b.writeUInt32LE(value,offset);await assert.rejects(reader.decode(b,material),/lunghezze/);}
  await assert.rejects(reader.decode(valid.subarray(0,valid.length-20),material));
  const corrupt=Buffer.from(valid);corrupt[48]^=255;await assert.rejects(reader.decode(corrupt,material));
  const a=reader.parse('// <c>test</c>\n1.0 same !\n9007199254740993 big !\n0 present !');
  const b=reader.parse('// <c>test</c>\n1.000000 same !\n9007199254740992 big !\n0 new !');
  assert.deepEqual(reader.compare(a,b).map(r=>r.status),['same','changed','only-a','only-b']);
  console.log('PASS: '+count+' synthetic encrypted containers; notes, trailers, duplicates, exact values, corruption, bounds and version errors. No simulator-acceptance claim.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
