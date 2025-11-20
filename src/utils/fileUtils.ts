import fs from 'fs/promises';

/**
 * Read JSON file and parse it
 * @param filePath Path to the JSON file
 * @returns Parsed JSON data or null if file doesn't exist
 */
export async function readJsonFile(filePath: string): Promise<any> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or parsing error, return null
    return null;
  }
}

/**
 * Write JSON data to file with pretty formatting
 * @param filePath Path to the file
 * @param data Data to write
 */
export async function writeJsonFile(filePath: string, data: any): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Append content to a file with newline
 * @param filePath Path to the file
 * @param content Content to append
 */
export async function appendToFile(filePath: string, content: string): Promise<void> {
  await fs.appendFile(filePath, content + '\n');
}

/**
 * Append multiple JSON objects to a file, each on new lines
 * @param filePath Path to the log file
 * @param items Array of items to append as JSON
 */
export async function appendJsonToFile(filePath: string, ...items: any[]): Promise<void> {
  const content = items.map(item => JSON.stringify(item)).join('\n');
  await appendToFile(filePath, content);
}
