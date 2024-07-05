export interface Props {
  defaultColor?: string;
  colors?: string[];
  visiable?:boolean;
  callback?:(color:string)=>void,
  
  pos:{
    x:number,
    y:number
  }
}