export const getKeys = <T extends {}>(obj: T) => {
  return Object.keys(obj) as Array<keyof T>;
};

export const getEntries = <T extends {}>(obj: T) => {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
};

const myColorMap= {
  'primary':'blue',
  'secondary':'gray'
} 
for (const colorVal in myColorMap) {
  const color = myColorMap[colorVal as keyof typeof myColorMap];
}
