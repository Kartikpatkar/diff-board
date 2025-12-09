export async function save(key, value){
  try{localStorage.setItem(key, JSON.stringify(value));}catch(e){console.warn(e)}
}
export function load(key){
  try{return JSON.parse(localStorage.getItem(key));}catch(e){return null}
}
