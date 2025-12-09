#!/bin/bash

# Install GSAP and related plugins
npm install gsap @gsap/shockingly

# Install Three.js
npm install three @types/three

# Additional animation libraries (optional but recommended)
npm install framer-motion
npm install lottie-react
npm install react-intersection-observer

echo "✅ Animation packages installed successfully!"
echo "Note: GSAP's premium plugins (ScrollSmoother) require a license."
echo "You can get a free trial at: https://greensock.com/scrollsmoother/"
