//import { FfmpegClass, ffmpeg } from "https://deno.land/x/deno_ffmpeg@v3.1.0/mod.ts";


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
  }

  async process(currentTime) {
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

    await this.applyTweens();
    await this.applyEffects();
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

  async processTextbox() {
    // Process the textbox object
    // Add your textbox processing logic here
  }

  async processTTS() {
    // Process the TTS object
    // Add your TTS processing logic here
  }

  async applyTweens() {
    // Apply tweens to the object
    // Add your tween application logic here
  }

  async applyEffects() {
    // Apply effects to the object
    // Add your effect application logic here
  }
}