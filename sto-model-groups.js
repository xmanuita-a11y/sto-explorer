/* Exact observed STO schemas. A structural group is never a native binding. */
const StoModelGroups=(()=>{
  'use strict';
  function fields(sto){return sto.entries.map(row=>row.id);}
  function lookup(sto,catalog){
    if(!sto||sto.unparsed?.length||!catalog||catalog.schemaVersion!==1)return null;
    const signature=JSON.stringify(fields(sto));
    const model=catalog.models.find(row=>row.car===sto.car&&row.contentVersion===sto.contentVersion);
    if(!model)return null;
    const schema=model.schemas.find(row=>JSON.stringify(row.fields)===signature);
    if(!schema)return null;
    return {groupId:schema.groupId,car:model.car,contentVersion:model.contentVersion,
      fieldCount:schema.fields.length,observedFiles:schema.observedFiles,
      nativeVerified:false,authority:'observed ordered STO field identities only'};
  }
  return Object.freeze({fields,lookup});
})();
if(typeof module!=='undefined')module.exports=StoModelGroups;
