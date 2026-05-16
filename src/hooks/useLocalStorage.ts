import { useEffect, useState } from 'react';
export function useLocalStorage<T>(key:string, initial:T){
 const [value,setValue]=useState<T>(()=>{try{const item=localStorage.getItem(key);return item?JSON.parse(item):initial}catch{return initial}});
 useEffect(()=>{localStorage.setItem(key,JSON.stringify(value))},[key,value]);
 return [value,setValue] as const;
}
