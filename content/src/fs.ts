import fs from "fs";

// JSONファイルを読み込む関数
export function readJSONFile(filepath: string) {
  try {
    const data = fs.readFileSync("data/" + filepath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error(err);
    return {};
  }
}
export function writeJSONFile(filepath: string, obj: any) {
  try {
    fs.writeFileSync("data/" + filepath, JSON.stringify(obj, null, 2), "utf8");
    console.log(`Successfully saved changes to ${filepath}`);
  } catch (err) {
    console.error(err);
  }
}
