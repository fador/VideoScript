import * as yaml from "https://deno.land/std@0.186.0/yaml/mod.ts";
import { VideoScriptObject } from "./VideoScriptObject.ts"
import { VideoScriptScene } from "./VideoScriptScene.ts"

async function parseVideoScript(filePath) {
  const content = await Deno.readTextFile(filePath);
  return yaml.parse(content);
}



async function main(inputPath) {
  const videoScriptData = await parseVideoScript(inputPath);
  
  const scene = new VideoScriptScene(videoScriptData.init, videoScriptData.scene);
  
  await scene.preprocess();
  await scene.process();
}

const inputPath = "test.yaml";
main(inputPath);
