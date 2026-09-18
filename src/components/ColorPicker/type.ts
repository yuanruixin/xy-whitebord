export interface Props {
  defaultColor?: string;
  colors?: string[];
  visible?:boolean;
  callback?:(color:string)=>void,
  
  pos:{
    x:number,
    y:number
  }
}