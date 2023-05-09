//import { FfmpegClass, ffmpeg } from "https://deno.land/x/deno_ffmpeg@v3.1.0/mod.ts";
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
    await this.applyEffects(currentTime);
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

  getTweenProgress(tween, currentTime) {
    const duration = tween.end_time - tween.start_time;
    const progress = (currentTime - tween.start_time) / duration;

    switch (tween.type) {
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

  applyTween(tween, progress) {
    const interpolate = (start, end) => start + progress * (end - start);
    //console.log(Deno.inspect(tween.start_state));
    for (const key in tween.start_state) {
      for(const value in key) {
        this.transform[key][value] = interpolate(tween.start_state[key][value], tween.end_state[key][value]);
      }
    }
  }

  async applyTweens(currentTime) {    
    for (const tween_ of this.tweens) {
      const tween = tween_.tween;
      //console.log(`${currentTime} >= ${tween.start_time} && ${currentTime} <= ${tween.end_time}`);  
      if (currentTime >= parseFloat(tween.start_time) && currentTime <= parseFloat(tween.end_time)) {
        const progress = this.getTweenProgress(tween, currentTime);
        this.applyTween(tween, progress);
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
    for (const effect_ of this.effects) {
      const effect = effect_.effect;
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