import { exists } from "https://deno.land/std/fs/mod.ts";
import { dirname, fromFileUrl } from "https://deno.land/std/path/mod.ts";
import { VideoScriptObject } from "./VideoScriptObject.ts"
import {Image} from "https://deno.land/x/imagescript@1.2.15/mod.ts";


async function convertVideoToImages(inputPath, outputDir) {
  // Replace this line with the actual implementation of ffmpeg to
  // convert the video to an image sequence and save it in the outputDir
  console.log(`Converting ${inputPath} to image sequence in ${outputDir}`);
}


export class VideoScriptScene {
  constructor(initData, sceneData) {
    this.width = parseInt(initData.resolution.split('x')[0]);
    this.height = parseInt(initData.resolution.split('x')[1]);
    this.fps = parseInt(initData.target_fps);
    this.description = initData.description;
    
    this.current_image = new Image(this.width, this.height);
    
    this.objects = sceneData.map((objData) => new VideoScriptObject(objData));
    //console.log(Deno.inspect(this.objects));
    this.activeObjects = new Map();
  }

  async preprocess() {
    const basePath = dirname(fromFileUrl(import.meta.url));
    for (const obj of this.objects) {
      //console.log(Deno.inspect(obj));
      
      //console.log(`${obj.name} (${obj.type}): ${obj.source}`);
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
    const frameDuration = 1.0 / this.fps;
    let currentTime = 0;
    const endTime = Math.max(...this.objects.map((obj) => obj.endTime));

    let frame = 0;
    
    const ffmpeg = Deno.run({
      cmd: [
        "ffmpeg",
        "-f", "rawvideo",
        "-pix_fmt", "rgba",
        "-s", `${this.width}x${this.height}`,
        "-r", `${this.fps}`,
        "-i", "-",
        "-c:v","libx264",
        "-preset","fast",
        "-pix_fmt", "yuv420p10le",
        "-crf", "22",
        "-y", // overwrite output file if it exists
        "output.mp4"
      ],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped"
    });
    
    
    while (currentTime <= endTime) {
      console.log(`Processing frame ${frame}`);
      this.current_image.fill((x, y) => Image.hslToColor(208, .66, .14));
      
      this.updateActiveObjects(currentTime);

      for (const obj of this.activeObjects.values()) {
        await obj.process(currentTime);
        if(obj.image != null) {
          this.current_image.composite(obj.image, obj.transform.pos[0], obj.transform.pos[1]);
          //console.log(`Composite: ${obj.image.width}x${obj.image.height}: ${obj.transform.pos[0]}, ${obj.transform.pos[1]}`);
        }
      }

      currentTime += frameDuration;
      frame = frame + 1;
      
      let written = 0;
      // Write 1kB at a time since there is a limit in the buffer
      for(let datasize = 0; datasize < this.width*this.height*4; datasize += 1024) {
        written += await ffmpeg.stdin.write(this.current_image.bitmap.subarray(datasize,datasize+1024));
      }
            
      
      
      //if(frame > 300) break;
      
      //const encoded = await this.current_image.encode();
      // const outputDir = `output/out_${frame}.png`;
      //await Deno.writeFile(outputDir, encoded);

    }
    ffmpeg.stdin.close();
    const { code } = await ffmpeg.status();

    //const rawOutput = new TextDecoder().decode(await ffmpeg.output());
    //console.log(rawOutput);
      
    if (code !== 0) {
      const stderr = new TextDecoder().decode(await ffmpeg.stderrOutput());
      console.error(stderr);      
    }

    ffmpeg.close();
    
  }
}
