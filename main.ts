import * as yaml from "https://deno.land/std@0.186.0/yaml/mod.ts";
import { VideoScriptObject } from "./VideoScriptObject.ts"
import { VideoScriptScene } from "./VideoScriptScene.ts"

async function parseVideoScript(filePath) {
  const content = await Deno.readTextFile(filePath);
  return yaml.parse(content);
}



async function main(inputPath) {
  const videoScriptData = await parseVideoScript(inputPath);
  
  const scene = new VideoScriptScene(videoScriptData.scene, videoScriptData.objects);
  
  await scene.preprocess();
  await scene.process();
}

if (Deno.args.length < 1) {
  console.log("Usage: deno run main.ts [VideoScript file]");  
  Deno.exit();
}

const inputPath = Deno.args[0]; 
main(inputPath);
