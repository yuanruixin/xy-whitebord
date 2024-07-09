interface DownloadFileOption {
  fileName?: string;
}
function isBase64Image(str:string){
  const base64ImgReg = /^data:image\/\w+;base64,/;  
  return base64ImgReg.test(str);
}
// 获取bsese64图片的类型
function getBase64Type(str:string){
  const base64ImgReg = /^data:image\/(\w+);base64,/;
  const result = base64ImgReg.exec(str);
  const securityType = ['png','jpg','jpeg','svg'];
  if(result && securityType.includes(result[1])){
    return result[1];
  }else{
    throw new Error('base64 image type is png|jpg|jpeg');
  }
}
function isJSON(str:string) {
  if (typeof str == 'string') {
      try {
          const obj=JSON.parse(str);
          if(typeof obj == 'object' && obj ){
              return true;
          }else{
              return false;
          }

      } catch(e) {
          return false;
      }
  }
}

export const downloadFile = (
  data: string,
  option?: DownloadFileOption
) => {
  const a = document.createElement("a");
  const event = new MouseEvent("click");
  const fileName = option?.fileName ?? "data";
  let href = ''
  if(isBase64Image(data)){
    href = data;
    a.download = `${fileName}.${getBase64Type(data)}`;
  }else if(isJSON(data)){
    const objectUrl = URL.createObjectURL(new Blob([data]));
    href = objectUrl;
    a.download = `${fileName}.json`;
  }else{
    throw new Error('data is not base64 image or json');
  }
  a.href = href;
  a.dispatchEvent(event);
  a.remove();
  // 下载完，对URL进行释放
  URL.revokeObjectURL(href);
};

export const selectSingleFile = (): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    // 仅支持文件单选

    input.type = "file";
    input.onchange = () => {
      const files = input.files;
      resolve(files ? files[0] : null);
    };
    input.click();
  });
};
