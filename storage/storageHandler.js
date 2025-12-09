// Storage handler (placeholder)
export async function saveItem(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}
export function getItem(key){
  try{return JSON.parse(localStorage.getItem(key));}catch(e){return null}
}
