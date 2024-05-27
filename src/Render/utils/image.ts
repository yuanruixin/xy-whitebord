export const loadImage = (url: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    let img = new Image();
    img.src = url;
    img.onload = () => {
      resolve(img);
    };

    img.onerror = () => {
      reject();
    };
    
  });
};
