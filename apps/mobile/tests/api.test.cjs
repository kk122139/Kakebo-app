
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const {join}=require("node:path");
const vm=require("node:vm");
const ts=require("typescript");
const source=ts.transpileModule(readFileSync(join(__dirname,"../src/api.ts"),"utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
function client(body,status=200){
 const exports={};
 vm.runInNewContext(source,{
 exports,
 require:(name)=>name==="react-native"?{Platform:{OS:"web"}}:{},
 process:{env:{}},
 fetch:async()=>new Response(body,{status}),
 AbortController,setTimeout,clearTimeout
 });
 return exports;
}
test("respuesta HTTP 200 vacía de Nest representa ausencia de presupuesto",async()=>{
 assert.equal(await client("").api("/summary?month=2026-11"),null);
});
test("JSON null también representa ausencia de presupuesto",async()=>{
 assert.equal(await client("null").api("/summary?month=2026-11"),null);
});
test("un presupuesto JSON mantiene sus datos reales",async()=>{
 const data={income:900000,fixed:450000,saving:200000,spent:25000,available:225000,categories:[{category:"Ocio",total:25000}],closed:false};
 const result=await client(JSON.stringify(data)).api("/summary?month=2026-11");
 assert.equal(JSON.stringify(result),JSON.stringify(data));
});
test("un error HTTP sin cuerpo produce mensaje recuperable sin acceder a null.message",async()=>{
 await assert.rejects(client("",400).api("/budget","PUT",{}),/No se pudo completar/);
});
test("JSON inválido no se convierte silenciosamente en un presupuesto vacío",async()=>{
 await assert.rejects(client("<html>error</html>").api("/summary?month=2026-11"),/respuesta no válida/);
});
