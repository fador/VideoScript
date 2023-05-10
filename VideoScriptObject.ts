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
  }

  async process(currentTime) {
    console.log(`Process ${this.type}`);
    switch (this.type) {
      case "video":
        await this.processVideo(currentTime);
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

    await this.applyTweens(currentTime);
    if(this.transform.scale[0] != 1 || this.transform.scale[1] != 1) {
      await this.scaleImage(this.transform.scale[0], this.transform.scale[1]);
    }
    await this.applyEffects(currentTime);
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
        let interpolated = this.bilinearInterpolation(this.image, srcX, srcY);
        let newPos = (y * newWidth + x) * 4;
        //console.log(interpolated);
        newImage.bitmap[newPos] = interpolated[0]; // R
        newImage.bitmap[newPos + 1] = interpolated[1]; // G
        newImage.bitmap[newPos + 2] = interpolated[2]; // B
        newImage.bitmap[newPos + 3] = interpolated[3]; // A
      }
    }
    this.image = newImage;
  }

  async processVideo() {
    // Process the video using the ffmpeg module and the provided source
    const inputPath = this.source;
    const outputPath = `output/${this.name}.mp4`;
    
    //await denoFfmpeg(inputPath, outputPath, this.transform);
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