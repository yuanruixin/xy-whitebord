/**
 *@description 参数为联合类型时，结果无法正确推导
 *  */
export const getKeys = <T extends {}>(obj: T) => {
  return Object.keys(obj) as Array<keyof T>;
};

export const getEntries = <T extends {}>(obj: T) => {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
};
