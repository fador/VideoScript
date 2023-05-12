# VideoScript: A Custom Scripting Language for Video Creation

VideoScript is a custom scripting language specifically designed for creating videos. Built on the YAML language, it provides a comprehensive and user-friendly framework for defining video scenes with various objects, such as images, textboxes and more. With its unique tts (text-to-speech) feature, VideoScript allows for seamless integration of voiceover content.

VideoScript sample parser is built on top of Deno JavaScript framework.

## Key Features:

- **Objects:** Define your scene with various object types including image, textbox and more. Upcoming support for video, audio, and user-defined objects.
- **Animation Tweens:** Create smooth animations between states with different tween types (linear, ease-in, ease-out, ease-in-out).
  - Supports transform, scale and rotation
- **Effects:** Add a variety of effects to your objects, with parameters and specific time frames. Currently supports fade-in and fade-out effects with more to come.

## Planned Features:

- **Text-to-Speech:** An exclusive tts feature for integrating voiceover content.
- Support for video, audio, and user-defined objects (for svg shapes).
- Additional effects beyond the currently available fade-in and fade-out.


## VideoScript Format

Here's a template for the VideoScript format:

```yaml
scene:
  resolution: (video resolution, eg. 1280x720)
  target_fps: (framerate, eg. 60)
  description: (metadata to add to the videofile)
objects: [
  {
    name: (object name),
    type: (object type, e.g., image, textbox),
    source: (file path or text or object definition),
    start_time: (time in seconds),
    end_time: (time in seconds),
    transform: {
      pos: [x, y, z],
      scale: [x, y, z],
      rot: [x, y, z]
    },
    tweens: [
      { 
        type: (tween type), 
        state_array: [
          {
            time: (seconds),
            pos: [x, y, z],
            scale: [x, y, z],
            rot: [x, y, z]
          },
        ]
      },
    ],
    effects: [
      {
        name: (effect name)
        parameters: (effect parameters)
        start_time: (seconds)
        end_time: (seconds)
      },
    ]
  },
]
```

## Contribution:

VideoScript is an open-source project, and we welcome contributions from the community. Feel free to raise issues, make suggestions, or submit pull requests. Together, we can make VideoScript the go-to solution for all your video creation needs.