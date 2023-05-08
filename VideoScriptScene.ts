import { exists } from "https://deno.land/std/fs/mod.ts";
import { dirname, fromFileUrl } from "https://deno.land/std/path/mod.ts";
import { VideoScriptObject } from "./VideoScriptObject.ts"


async function convertVideoToImages(inputPath, outputDir) {
  // Replace this line with the actual implementation of ffmpeg to
  // convert the video to an image sequence and save it in the outputDir
  console.log(`Converting ${inputPath} to image sequence in ${outputDir}`);
}


export class VideoScriptScene {
  constructor(sceneData) {
    
    this.objects = sceneData.map((objData) => new VideoScriptObject(objData.object));
    //console.log(Deno.inspect(this.objects));
    this.activeObjects = new Map();
  }

  async preprocess() {
    const basePath = dirname(fromFileUrl(import.meta.url));
    for (const obj of this.objects) {
      //console.log(Deno.inspect(obj));
      
      console.log(`${obj.name} (${obj.type}): ${obj.source}`);
      const sourcePath = `${basePath}/${obj.source}`;
      

      if (obj.type === "video") {
        if (!(await exists(sourcePath))) {
          throw new Error(`Input file not found: ${sourcePath}`);
        }
        const outputDir = `${basePath}/output/${obj.name}_images`;
        await Deno.mkdir(outputDir, { recursive: true });
        await convertVideoToImages(sourcePath, outputDir);
      }
    }
  }


  updateActiveObjects(currentTime) {
    for (const obj of this.objects) {
      if (obj.startTime <= currentTime && obj.endTime >= currentTime) {
        this.activeObjects.set(obj.name, obj);
      } else {
        this.activeObjects.delete(obj.name);
      }
    }
  }

  async process() {
    const frameDuration = 1 / 30; // Assuming a frame rate of 30fps
    let currentTime = 0;
    const endTime = Math.max(...this.objects.map((obj) => obj.endTime));

    while (currentTime <= endTime) {
      this.updateActiveObjects(currentTime);

      for (const obj of this.activeObjects.values()) {
        await obj.process(currentTime);
      }

      currentTime += frameDuration;
    }
  }
}
