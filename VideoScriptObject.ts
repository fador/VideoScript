import {Image} from "https://deno.land/x/imagescript@1.2.15/mod.ts";



export class VideoScriptObject {
  constructor(objData) {
    this.name = objData.name;
    this.type = objData.type;
    this.source = objData.source;
    this.startTime = objData.start_time;
    this.endTime = objData.end_time;
    this.transform = objData.transform;
    this.tweens = objData.tweens || [];
    this.effects = objData.effects || [];
    this.image = null;
    this.tempData = null;
    this.dataLoaded = false;
  }

  async process(currentTime) {
    console.log(`Process ${this.type}`);
    switch (this.type) {
      case "video":
        await this.processVideo(currentTime);
        break;
      case "image":
        await this.processImage(currentTime);
        break;
      case "audio":
        await this.processAudio(currentTime);
        break;
      case "user-defined":
        await this.processUserDefined(currentTime);
        break;
      case "textbox":
        await this.processTextbox(currentTime);
        break;
      case "tts":
        await this.processTTS(currentTime);
        break;
      default:
        throw new Error(`Unsupported object type: ${this.type}`);
    }

    if(this.image != null) {
      await this.applyTweens(currentTime);
      if(this.transform.scale[0] != 1 || this.transform.scale[1] != 1) {
        await this.scaleImage(this.transform.scale[0], this.transform.scale[1]);
      }
      if(this.transform.rot[2] != 0) {      
        await this.rotateImage(this.transform.rot[2]); // assuming z is the rotation in degrees
      }
      await this.applyEffects(currentTime);
    }
  }


  getPixel(image, x, y) {
    let pos = (y * image.width + x) * 4;
    return [
      image.bitmap[pos], // R
      image.bitmap[pos + 1], // G
      image.bitmap[pos + 2], // B
      image.bitmap[pos + 3] // A
    ];
  }

  lerp(start, end, t) {
    return start * (1.0 - t) + end * t;
  }

  bilinearInterpolation(image, x, y) {
    let x1 = Math.floor(x);
    let y1 = Math.floor(y);
    let x2 = Math.ceil(x);
    let y2 = Math.ceil(y);

    let v1 = this.getPixel(image, x1, y1);
    let v2 = this.getPixel(image, x2, y1);
    let v3 = this.getPixel(image, x1, y2);
    let v4 = this.getPixel(image, x2, y2);

    let out = [0,0,0,0];

    for(let i = 0; i < 4; i++) {
      let r1 = this.lerp(v1[i], v2[i], x - x1);
      let r2 = this.lerp(v3[i], v4[i], x - x1);
      out[i] = this.lerp(r1, r2, y - y1);
    }

    return out;
  }
  
  async scaleImage(scaleX, scaleY) {
    
    let newWidth = Math.floor(this.image.width * scaleX);
    let newHeight = Math.floor(this.image.height * scaleY);
    
    //console.log(`Scale: ${scaleX}x${scaleY} ${newWidth}x${newHeight}`);
    
    
    var newImage = new Image(newWidth, newHeight);
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        let srcX = x / scaleX;
        let srcY = y / scaleY;
        /*
        let interpolated = this.bilinearInterpolation(this.image, srcX, srcY);
        let newPos = (y * newWidth + x) * 4;
        //console.log(interpolated);
        newImage.bitmap[newPos] = interpolated[0]; // R
        newImage.bitmap[newPos + 1] = interpolated[1]; // G
        newImage.bitmap[newPos + 2] = interpolated[2]; // B
        newImage.bitmap[newPos + 3] = interpolated[3]; // A
        */
        let numSamples = 4; // increase this for better quality
        let total = [0, 0, 0, 0];
        for (let sy = 0; sy < numSamples; sy++) {
          for (let sx = 0; sx < numSamples; sx++) {
            let sample = this.bilinearInterpolation(this.image, srcX + sx / numSamples / scaleX, srcY + sy / numSamples / scaleY);
            total = total.map((sum, i) => sum + sample[i]);
          }
        }
        let averaged = total.map(sum => sum / (numSamples * numSamples));
        let newPos = (y * newWidth + x) * 4;
        newImage.bitmap[newPos] = averaged[0]; // R
        newImage.bitmap[newPos + 1] = averaged[1]; // G
        newImage.bitmap[newPos + 2] = averaged[2]; // B
        newImage.bitmap[newPos + 3] = averaged[3]; // A
      }
    }
    this.image = newImage;
  }

  getRotatedBoundingBox(width, height, degrees) {
    let radians = degrees * (Math.PI / 180.0);
    let cos = Math.cos(radians);
    let sin = Math.sin(radians);

    // Calculate the coordinates of the corners of the original rectangle
    let halfWidth = width / 2;
    let halfHeight = height / 2;
    let corners = [
      [-halfWidth, -halfHeight],
      [halfWidth, -halfHeight],
      [halfWidth, halfHeight],
      [-halfWidth, halfHeight]
    ];

    // Rotate the corners
    let rotatedCorners = corners.map(([x, y]) => [
      x * cos - y * sin,
      x * sin + y * cos
    ]);

    // Calculate the bounding box
    let xs = rotatedCorners.map(([x, _]) => x);
    let ys = rotatedCorners.map(([_, y]) => y);
    let minX = Math.min(...xs);
    let maxX = Math.max(...xs);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: Math.floor(maxX - minX),
      height: Math.floor(maxY - minY)
    };
  }


  async rotateImage(degrees) {
    let radians = degrees * (Math.PI / 180.0);
    let cos = Math.cos(radians);
    let sin = Math.sin(radians);
    let centerX = Math.floor(this.image.width / 2);
    let centerY = Math.floor(this.image.height / 2);
    
    // Calculate new dimensions
    //let newWidth = Math.abs(this.image.width * cos) + Math.abs(this.image.height * sin);
    //let newHeight = Math.abs(this.image.width * sin) + Math.abs(this.image.height * cos);
    //newWidth = Math.ceil(newWidth);
    //newHeight = Math.ceil(newHeight);
    let boundingBox = this.getRotatedBoundingBox(this.image.width, this.image.height, degrees);
    let newWidth = boundingBox.width;
    let newHeight = boundingBox.height;
    
    let newCenterX = boundingBox.width / 2;
    let newCenterY = boundingBox.height / 2;
    //console.log(`Rot: ${degrees}: ${newWidth}x${newHeight}`);
    
    let newImage = new Image(newWidth, newHeight);
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        let dx = x - newCenterX;
        let dy = y - newCenterY;
        let srcX = dx * cos - dy * sin + centerX;
        let srcY = dx * sin + dy * cos + centerY;
        if (srcX >= 0 && srcX < this.image.width && srcY >= 0 && srcY < this.image.height) {
          let interpolated = this.bilinearInterpolation(this.image, srcX, srcY);
          let newPos = (y * newWidth + x) * 4;
          newImage.bitmap[newPos] = interpolated[0]; // R
          newImage.bitmap[newPos + 1] = interpolated[1]; // G
          newImage.bitmap[newPos + 2] = interpolated[2]; // B
          newImage.bitmap[newPos + 3] = interpolated[3]; // A
        }
      }
    }
    this.transform.pos[0]+=centerX-newCenterX;
    this.transform.pos[1]+=centerY-newCenterY;
    
    this.image = newImage;
  }

  async processVideo() {
    // Process the video using the ffmpeg module and the provided source
    const inputPath = this.source;
    const outputPath = `output/${this.name}.mp4`;
    
    //await denoFfmpeg(inputPath, outputPath, this.transform);
  }
  
  async processImage(currentTime) {
    // Process the video using the ffmpeg module and the provided source
    const inputPath = this.source;
    if(!this.dataLoaded) {
      const binary = await Deno.readFile(inputPath);
      this.tempData = this.image = await Image.decode(binary);
      this.dataLoaded = true;
    }
    else {
      this.image = this.tempData;
    }
  }

  async processAudio() {
    // Process the audio using the ffmpeg module and the provided source
    // Add your audio processing logic here
  }

  async processUserDefined() {
    // Process the user-defined object
    // Add your user-defined object processing logic here
  }

  async processTextbox(currentTime) {
    // Process the textbox object
    // Add your textbox processing logic here
    const font = await Deno.readFile('./carbonphyber.ttf');
    this.image = await Image.renderText(font, 30, this.source, 0xffffffff);
  }

  async processTTS() {
    // Process the TTS object
    // Add your TTS processing logic here
  }

  getTweenProgress(type, tween1, tween2, currentTime) {
    const duration = tween1.time - tween2.time;
    const progress = (currentTime - tween1.time) / duration;

    switch (type) {
      case "linear":
        return progress;
      case "ease-in":
        return progress * progress;
      case "ease-out":
        return progress * (2 - progress);
      case "ease-in-out":
        return progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      default:
        return 1;
        //throw new Error(`Unsupported tween type: ${tween.type}`);
    }
  }

  applyTween(tween1, tween2, progress) {
    const interpolate = (start, end) => start + progress * (end - start);
    //console.log(Deno.inspect(tween.start_state));
    for (const key in tween1) {
      if(key == 'time') continue;
      for(const value in key) {        
        this.transform[key][value] = interpolate(tween1[key][value], tween2[key][value]);
      }
    }
  }

  async applyTweens(currentTime) {    
    
    for(const tween_idx in this.tweens) {
      const tween = this.tweens[tween_idx];
      //console.log(Deno.inspect(this.tweens));
      if(tween.states.length < 2) continue;
      for(let i = 1; i < tween.states.length; i++) {
        //console.log(`${currentTime} >= ${tween.start_time} && ${currentTime} <= ${tween.end_time}`);  
        if (currentTime >= parseFloat(tween.states[i-1].time) && currentTime <= parseFloat(tween.states[i].time)) {
          let progress = this.getTweenProgress(tween.type, tween.states[i-1], tween.states[i], currentTime);
          if(progress > 1.0) progress = 1.0;
          this.applyTween(tween.states[i-1], tween.states[i], progress);
        }
      }
    }
  }

  applyFade(effect, progress, image) {
    const strength = effect.name === "fade-in" ? progress : 1.0 - progress;
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        // Just change the alpha value in the RGBA array
        image.bitmap[(y*image.width+x)*4 + 3] = image.bitmap[(y*image.width+x)*4 + 3] * strength;
      }
    }
  }

  getEffectProgress(effect, currentTime) {
    const duration = effect.end_time - effect.start_time;
    return (currentTime - effect.start_time) / duration;
  }

  async applyEffects(currentTime) {
    for (const effect of this.effects) {
      if (currentTime >= parseFloat(effect.start_time) && currentTime <= parseFloat(effect.end_time)) {
        const progress = this.getEffectProgress(effect, currentTime);

        switch (effect.name) {
          case "fade-in":
          case "fade-out":
            this.applyFade(effect, progress, this.image);
            break;
          // add more effects here as necessary
          default:
             return;
            //throw new Error(`Unsupported effect: ${effect.name}`);
        }
      }
    }
  }
}