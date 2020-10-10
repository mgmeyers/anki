import { MdParser } from "./markdown/parsers/mdParser";
import { Card } from "./models/Card";

/**
 * Trim string and replaces spaces with underscore
 * Used for making tags
 */
export const sanitizeString = (str: string) => str.trim().replace(/\s/g, "_");

/**
 * Trim array from end
 */
export const trimArrayEnd = (array: any[]) => {
  const trimmedArray: any[] = [];
  let added = false;

  for (let i = array.length - 1; i >= 0; i -= 1) {
    if (array[i] || added) {
      trimmedArray.unshift(array[i]);
      added = true;
    }
  }

  return trimmedArray;
};

/**
 * Trim array from start
 */
export const trimArrayStart = (array: any[]) => {
  const trimmedArray = [];
  let added = false;

  for (let i = 0; i < array.length; i += 1) {
    if (array[i] || added) {
      trimmedArray.push(array[i]);
      added = true;
    }
  }

  return trimmedArray;
};

/**
 * Trim array
 */
export const trimArray = (array: any[]) => trimArrayEnd(trimArrayStart(array));


const QARegExp = /<!--[\s\n\r\t]*q:(?!front|back)([\w\W]+?)?-->([\w\W]+?)<!--[\s\n\r\t]*\/q[\s\n\r\t]*-->/g;
const FBRegExp = /<!--[\s\n\r\t]*q:front[\s\n\r\t]*-->([\w\W]+?)<!--[\s\n\r\t]*\/q:front[\s\n\r\t]*-->[\s\n\r\t]*<!--[\s\n\r\t]*q:back[\s\n\r\t]*-->([\w\W]+?)<!--[\s\n\r\t]*\/q:back[\s\n\r\t]*-->/g 

export async function getQABlocks(str: string) {
  const cards: Card[] = []
  const parser = new MdParser({})

  let match: RegExpExecArray | null;

  while ((match = QARegExp.exec(str)) !== null) {
    const front = match[1].trim();
    const back = match[2].trim();
    
    cards.push(new Card(
      await parser.parse(front),
      await parser.parse(back)
    ))
  }

  while ((match = FBRegExp.exec(str)) !== null) {
    const front = match[1].trim();
    const back = match[2].trim();
    
    cards.push(new Card(
      await parser.parse(front),
      await parser.parse(back)
    ))
  }

  return cards
}