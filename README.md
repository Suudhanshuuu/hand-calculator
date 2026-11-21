# 👋 Hand Number Counter

A fun web application that uses your webcam to detect and count raised fingers, then adds them together!

## Features

- ✅ Real-time hand detection using TensorFlow.js
- ✅ Finger counting algorithm
- ✅ Running total of all detected numbers
- ✅ Visual history of previous numbers
- ✅ Clean, responsive UI
- ✅ Works in most modern browsers

## How to Use

1. Open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari)
2. Click "Start Camera" and allow camera access
3. Show your hand with fingers raised
4. The system will detect and count your fingers
5. Show your hand again with a different number
6. The numbers will be added together!
7. Click "Reset" to clear the counter

## Requirements

- Modern web browser with WebGL support
- Webcam with decent lighting
- Internet connection (for loading TensorFlow.js models)

## Browser Support

- Chrome (recommended)
- Firefox
- Edge
- Safari (with some limitations)

## Technical Details

- Uses TensorFlow.js handpose model for hand detection
- Implements finger counting based on hand landmarks
- Pure JavaScript with no server-side processing
- All processing happens in your browser

## Limitations

- Works best with good lighting and clear hand visibility
- May struggle with very small hands or poor lighting
- Maximum 5 fingers detected (as expected!)
- Works best when hand is facing the camera

## Try It Out!

Just open the `index.html` file in your browser - no installation needed!

## Credits

- TensorFlow.js for hand detection
- Handpose model for landmark detection
- Simple, clean UI design
