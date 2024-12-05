let knobXValue = 0.5;
let knobYValue = 0.5;
let fluffyValue = 0;
let sleepyValue = 0;
let edgyValue = 0;
let isRaining = false;
let isPlaying = false;
let startTime = 0;
let rain;
let sky = [];
let cloudTimer = 0;
let activeCats = []; // Currently showing cats
let recentImages = []; // Record recently used pictures
const catSpawnInterval = 1000; // Minimum time interval for image generation (milliseconds）
let lastCatSpawnTime = 0; // The last time an image was generated
let bubbles = []; // The current bubble array
let fluffyInterval = null; // Timer variables

let rainPlayer;
let windPlayer;
let fluffySounds;
let musicPlayer;
let preGain,
  lowPass,
  compressor,
  distortion,
  eq,
  chorus,
  delay,
  reverb,
  limiter;

////////////////////////////////////////////////////////////
// TONE.JS SETUP & INITIALIZING
////////////////////////////////////////////////////////////

rainPlayer = new Tone.Player({
  url: "audio/rain.mp3",
  loop: true,
  autostart: true,
  volume: -Infinity,
}).toDestination();

windPlayer = new Tone.Player({
  url: "audio/wind.mp3",
  loop: true,
  autostart: true,
  volume: -Infinity,
}).toDestination();

// fluffySounds = new Tone.Players({   //Tried using players but failed
//   fluffy1: "audio/meow1.mp3",
//   fluffy2: "audio/meow2.mp3",
//   fluffy3: "audio/sheep.mp3",
//   fluffy4: "audio/dog.mp3",
//   fluffy5: "audio/bird.mp3",
// }).toDestination();

fluffySounds = [
  new Tone.Player({ url: "audio/meow1.mp3", loop: false }).toDestination(),
  new Tone.Player({ url: "audio/meow2.mp3", loop: false }).toDestination(),
  new Tone.Player({ url: "audio/bird.mp3", loop: false }).toDestination(),
];

function updateFluffy() {
  if (fluffyInterval) {
    clearInterval(fluffyInterval);
  }
  if (fluffyValue === 0) {
    console.log("FluffyValue is 0, no sounds will be played.");
    return;
  }
  const minRate = 4;
  const maxRate = 8;
  const triggerRate = Math.round(fluffyValue * (maxRate - minRate) + minRate);
  console.log("Trigger rate (times per minute):", triggerRate);
  const intervalTime = (60 / triggerRate) * 1000;
  console.log("Interval time (ms):", intervalTime);
  fluffyInterval = setInterval(() => {
    const randomPlayer =
      fluffySounds[Math.floor(Math.random() * fluffySounds.length)];
    randomPlayer.start();
    console.log("Fluffy sound played at:", new Date().toLocaleTimeString());
  }, intervalTime);
}

rainPlayer.sync();
windPlayer.sync();

fluffySounds.forEach((player, index) => {
  player.sync();
});

preGain = new Tone.Gain(0.5);

compressor = new Tone.Compressor({
  ratio: 2,
  threshold: -10,
  attack: 0.05,
  release: 0.5,
  knee: 10,
});

lowPass = new Tone.Filter({
  type: "lowpass",
  frequency: 20000,
  rolloff: -24,
});

distortion = new Tone.Distortion({
  distortion: 0.4,
  wet: 0,
});

eq = new Tone.EQ3({
  low: 0,
  mid: 0,
  high: 0,
  lowFrequency: 400,
  highFrequency: 2500,
});

chorus = new Tone.Chorus({
  frequency: 1.5,
  delayTime: 3.5,
  depth: 0.7,
  type: "sine",
  spread: 180,
  wet: 0,
});

delay = new Tone.PingPongDelay({
  delayTime: 0.25,
  maxDelayTime: 1,
  wet: 0,
});

reverb = new Tone.JCReverb({
  roomSize: 0.5,
  wet: 0,
});

limiter = new Tone.Limiter(-6);

async function initAudio() {
  if (Tone.context.state !== "running") {
    await Tone.start();
    console.log("Tone.js AudioContext started");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initAudio();
});

////////////////////////////////////////////////////////////
// UPLOAD MUSIC & PLAYBACK CONTROL
////////////////////////////////////////////////////////////
async function loadCustomMusic(url, trackName = null) {
  if (musicPlayer) {
    musicPlayer.stop();
    musicPlayer.dispose();
  }

  musicPlayer = new Tone.Player({
    url: url,
    loop: true,
    autostart: true,
  }).chain(
    preGain,
    compressor,
    lowPass,
    distortion,
    eq,
    chorus,
    delay,
    reverb,
    limiter,
    Tone.Destination
  );
  musicPlayer.sync();

  await Tone.loaded();
  console.log("Music loaded:", url);
  currentTrack = trackName || "Unknown Track";
  document.getElementById("current-track-label").textContent = trackName;

  startTime = 0;
  Tone.Transport.start("+0.1", startTime);
  isPlaying = true;
  togglePlayPauseButtons(true);
}

function togglePlayPauseButtons(isPlaying) {
  const playButton = document.getElementById("play-button");
  const pauseButton = document.getElementById("pause-button");

  if (isPlaying) {
    playButton.style.display = "none";
    pauseButton.style.display = "inline-block";
  } else {
    playButton.style.display = "inline-block";
    pauseButton.style.display = "none";
  }
}

function playAll() {
  if (!isPlaying) {
    Tone.Transport.start("+0.1", startTime);
    isPlaying = true;
    togglePlayPauseButtons(true);
    console.log("Playback started");
  }
}

function pauseAll() {
  if (isPlaying) {
    Tone.Transport.pause();
    startTime = Tone.Transport.seconds;
    isPlaying = false;
    togglePlayPauseButtons(false);
    console.log("Playback paused");
  }
}

function stopAll() {
  if (musicPlayer) {
    musicPlayer.restart();
  }
  Tone.Transport.stop();
  startTime = 0;
  isPlaying = false;
  togglePlayPauseButtons(false);
  console.log("Playback restarted from the beginning.");
}

document.getElementById("play-button").addEventListener("click", playAll);
document.getElementById("pause-button").addEventListener("click", pauseAll);
document.getElementById("stop-button").addEventListener("click", stopAll);

document
  .getElementById("uploadMusicButton")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      const objectURL = URL.createObjectURL(file);
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      await loadCustomMusic(objectURL, fileName);
      console.log("Custom music uploaded:", fileName);
    }
  });

document
  .getElementById("playDemoButton")
  .addEventListener("click", async () => {
    await loadCustomMusic("audio/orchid-gia.wav", "Demo Track: Orchid-Gia");
  });

////////////////////////////////////////////////////////////
// NEXUS UI
////////////////////////////////////////////////////////////

const panel = new Nexus.Position("#panel", {
  size: [300, 300],
  mode: "absolute",
  x: 0.5,
  minX: 0,
  maxX: 1,
  stepX: 0,
  y: 0.5,
  minY: 0,
  maxY: 1,
  stepY: 0,
});

panel.on("change", function (v) {
  knobXValue = v.x;
  knobYValue = v.y;
  isRaining = knobXValue < 0.45;
  console.log(`isRaining: ${isRaining}`);
});

const dialEdgy = new Nexus.Dial("#dial-edgy", {
  size: [90, 90],
  interaction: "vertical", // "radial", "vertical", or "horizontal"
  mode: "relative",
  min: 0,
  max: 1,
  step: 0,
  value: 0,
});
const numberEdgy = new Nexus.Number("#number-edgy", {
  size: [60, 25],
  value: 0,
  min: 0,
  max: 10,
  step: 1,
});
numberEdgy.link(dialEdgy);
dialEdgy.on("change", function (v) {
  edgyValue = v;
  distortion.wet.value = map(edgyValue, 0, 1, 0, 0.6);
  console.log(`Edgy Value: ${edgyValue}`);
});

const dialSleepy = new Nexus.Dial("#dial-sleepy", {
  size: [90, 90],
  interaction: "vertical", // "radial", "vertical", or "horizontal"
  mode: "relative",
  min: 0,
  max: 1,
  step: 0,
  value: 0,
});
const numberSleepy = new Nexus.Number("#number-sleepy", {
  size: [60, 25],
  value: 0,
  min: 0,
  max: 10,
  step: 0,
});
numberSleepy.link(dialSleepy);

dialSleepy.on("change", function (v) {
  sleepyValue = v;
  if (sleepyValue === 0) {
    lowPass.frequency.value = 20000;
  } else if (sleepyValue > 0.1) {
    lowPass.frequency.value = map(sleepyValue, 0.1, 1, 4000, 500);
  } else {
    lowPass.frequency.value = 4000;
  }
  console.log(`Lo-fi effect: SleepyValue=${sleepyValue}`);
});

const dialFluffy = new Nexus.Dial("#dial-fluffy", {
  size: [90, 90],
  interaction: "vertical", // "radial", "vertical", or "horizontal"
  mode: "relative",
  min: 0,
  max: 1,
  step: 0,
  value: 0,
});
const numberFluffy = new Nexus.Number("#number-fluffy", {
  size: [60, 25],
  value: 0,
  min: 0,
  max: 10,
  step: 1,
});
numberFluffy.link(dialFluffy);

dialFluffy.on("change", (v) => {
  fluffyValue = v;
  delay.wet.value = map(fluffyValue, 0, 1, 0, 0.15);
  updateFluffy();
});

updateFluffy();

////////////////////////////////////////////////////////////
// Oscilloscope (used ai to help with this, since the oschilloscope component from nexus ui didn't work.)
////////////////////////////////////////////////////////////

const oscilloscopeContainer = document.getElementById("oscilloscope");

// Create a Tone.js waveform analyzer and connect it to Tone.Destination
const waveformAnalyser = new Tone.Analyser("waveform", 512);
Tone.Destination.connect(waveformAnalyser); // Capture the audio signal that is ultimately output to the speaker

// Create a Canvas and add it to the oscilloscope container
const canvas = document.createElement("canvas");
oscilloscopeContainer.appendChild(canvas);
const canvasCtx = canvas.getContext("2d");

// Adjust the Canvas size according to the oscilloscope container size
function updateCanvasSize() {
  canvas.width = oscilloscopeContainer.clientWidth;
  canvas.height = oscilloscopeContainer.clientHeight;
}
updateCanvasSize();

// Monitor window size changes and dynamically adjust Canvas size
window.addEventListener("resize", updateCanvasSize);

// Dynamically draw waveforms
function drawWaveform() {
  const width = canvas.width;
  const height = canvas.height;

  // Get waveform data
  const waveform = waveformAnalyser.getValue();

  // Clear Background
  canvasCtx.fillStyle = "rgba(238, 238, 238, 1)";
  canvasCtx.fillRect(0, 0, width, height);

  // Draw a waveform
  canvasCtx.beginPath();
  for (let i = 0; i < waveform.length; i++) {
    const x = (i / waveform.length) * width;
    const y = mapRange(waveform[i], -1, 1, height, 0);

    if (i === 0) canvasCtx.moveTo(x, y);
    else canvasCtx.lineTo(x, y);
  }
  canvasCtx.strokeStyle = "rgba(36, 187, 187, 1)";
  canvasCtx.lineWidth = 2;
  canvasCtx.stroke();

  requestAnimationFrame(drawWaveform);
}

// Helper function: mapping numeric ranges
function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

drawWaveform();

////////////////////////////////////////////////////////////
// P5.JS & TONE.JS FOR PANEL PART
////////////////////////////////////////////////////////////

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  rain = new Rain();

  document.addEventListener("click", initAudio);
  document.addEventListener("touchstart", initAudio);

  let initialBubbles = int(map(sleepyValue, 0, 1, 0, 7));
  for (let i = 0; i < initialBubbles; i++) {
    bubbles.push(new Bubble(random(width), random(400, height + 100)));
  }
}

function draw() {
  let knobY = knobYValue * windowWidth;

  let rainIntensity = map(knobXValue, 0, 0.5, 500, 20);
  let rainVolume;
  let windVolume;

  if (knobXValue < 0.45) {
    rainPlayer.volume.value = map(knobXValue, 0, 0.45, 0, -20);
    windPlayer.volume.value = -Infinity;
  } else if (knobXValue > 0.55) {
    rainPlayer.volume.value = -Infinity;
    windPlayer.volume.value = map(knobXValue, 0.55, 1, -20, 15);
  } else {
    rainPlayer.volume.value = -Infinity;
    windPlayer.volume.value = -Infinity;
  }

  if (knobYValue > 0.5) {
    reverb.wet.value = map(knobYValue, 0.5, 1, 0, 0.2);
  } else {
    chorus.wet.value = map(knobYValue, 0, 0.5, 0.4, 0);
  }

  background(0, knobY / 2, knobY / 2);
  drawSkyAndSunMoon(knobY);

  if (isRaining) {
    rain.concentration(rainIntensity);
    rain.display();
    rain.fall();
    rain.hitsGround();
  }

  spawnClouds();
  updateAndDisplayClouds();

  manageCats();

  manageBubbles();
  for (let i = 0; i < bubbles.length; i++) {
    bubbles[i].show();
    bubbles[i].move();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawSkyAndSunMoon(knobY) {
  fill(0, (132 / width) * knobY + 50, (255 / width) * knobY + 50);
  ellipse(width / 2, height, width * 2, height);

  fill((255 / width) * knobY, (204 / width) * knobY, 0);
  circle(knobY, height / 5, height / 7);

  fill(255);
  circle(knobY * 3, height / 5, width / 10);
  fill(0, knobY / 2, knobY / 2);
  circle(knobY * 3 + 0.02 * width, height / 5, width / 10);
}

function Rain() {
  this.rainArr = [];
}

Rain.prototype.display = function () {
  for (let i = 0; i < this.rainArr.length; i++) {
    noStroke();
    fill(150, 255, 255, this.rainArr[i].alpha);
    rect(
      this.rainArr[i].x,
      this.rainArr[i].y,
      this.rainArr[i].w,
      this.rainArr[i].h,
      10
    );
  }
};

Rain.prototype.concentration = function (conc) {
  while (this.rainArr.length > conc) {
    this.rainArr.pop();
  }
  while (this.rainArr.length < conc) {
    this.rainArr.push(new SingleRainDrop());
  }
};

Rain.prototype.fall = function () {
  for (let i = 0; i < this.rainArr.length; i++) {
    this.rainArr[i].y +=
      this.rainArr[i].ySpeed * map(knobXValue, 0, 0.45, 3, 1);
  }
};

Rain.prototype.hitsGround = function () {
  for (let i = 0; i < this.rainArr.length; i++) {
    if (this.rainArr[i].y > height) {
      this.rainArr[i].y = -this.rainArr[i].h;
    }
  }
};

function SingleRainDrop() {
  this.x = random(0, width);
  this.y = random(0, height);
  this.w = random(2, 4);
  this.h = map(this.w, 2, 4, 16, 32);
  this.alpha = map(this.w, 2, 4, 50, 240);
  this.ySpeed = map(this.w, 2, 4, 4, 8);
}

class Cloud {
  constructor() {
    // CLOUD PROPERTIES
    this.puffNumber = int(random(7, 20));
    this.xSpeed = random(1, 2);
    this.size = random(50, 100);
    this.puffs = [];
    this.x = width + 100;
    this.y = random(40, height / 2);

    // BUILDING CLOUD
    for (let i = 0; i < this.puffNumber; i++) {
      let puff = {
        xOffset: random((this.size / 2) * -1, this.size / 2),
        yOffset: random((this.size / 4) * -1, this.size / 4),
        size: this.size * random(0.7, 1),
      };
      this.puffs.push(puff);
    }

    // SHEEP TRASITION
    this.sheepTransition = 0;
    this.headDirection = random(["front", "side"]);
  }

  update() {
    this.x -= this.xSpeed;

    if (fluffyValue > 0.5) {
      this.sheepTransition = lerp(this.sheepTransition, fluffyValue, 0.05);
    } else {
      this.sheepTransition = lerp(this.sheepTransition, 0, 0.1);
    }
  }

  paint() {
    noStroke();
    fill(255, 255, 255, 150);
    for (let i = 0; i < this.puffs.length; i++) {
      ellipse(
        this.x + this.puffs[i].xOffset,
        this.y + this.puffs[i].yOffset,
        this.puffs[i].size
      );
    }

    if (this.sheepTransition > 0) {
      this.drawSheepHead();
    }
  }

  drawSheepHead() {
    push();
    translate(this.x - this.size / 2, this.y);
    let headSize = this.size * 0.6 * this.sheepTransition;
    let earSize = headSize * 0.4;
    let eyeSize = headSize * 0.1;

    if (this.headDirection === "front") {
      // FACE FRONT
      fill(255);
      ellipse(0, 0, headSize, headSize); // HEAD

      fill(200, 150, 150);
      ellipse(-headSize / 2, -headSize / 4, earSize, earSize * 0.6); // LEFT EAR
      ellipse(-headSize / 2, headSize / 4, earSize, earSize * 0.6); // RIGHT EAR

      fill(0);
      ellipse(-headSize / 6, -headSize / 8, eyeSize, eyeSize); // LEFT EYE
      ellipse(-headSize / 6, headSize / 8, eyeSize, eyeSize); // RIGHT EYE

      stroke(0);
      strokeWeight(1);
      line(-headSize / 8, headSize / 10, -headSize / 8, headSize / 5); // MOUTH
    } else {
      // FACE LEFT
      fill(255);
      ellipse(0, 0, headSize, headSize); // HEAD

      fill(200, 150, 150);
      ellipse(-headSize / 3, -headSize / 5, earSize, earSize * 0.6); // EAR

      fill(0);
      ellipse(-headSize / 8, 0, eyeSize, eyeSize); // ONE EYE

      stroke(0);
      strokeWeight(1);
      line(-headSize / 10, headSize / 6, -headSize / 8, headSize / 5); // MOUTH
    }

    pop();
  }
}

function spawnClouds() {
  if (knobXValue <= 0.55) return;

  cloudTimer++;
  let spawnInterval = map(knobXValue, 0.55, 1, 200, 60);

  if (cloudTimer > spawnInterval) {
    sky.push(new Cloud());
    cloudTimer = 0;
  }
}

function updateAndDisplayClouds() {
  if (knobXValue <= 0.55) {
    sky = [];
    return;
  }

  for (let i = sky.length - 1; i >= 0; i--) {
    sky[i].update();
    sky[i].paint();

    if (sky[i].x < -100) {
      sky.splice(i, 1);
    }
  }
}

const catImages = [
  "images/line_puppy.gif",
  "images/line_puppy1.gif",
  "images/line_puppy2.gif",
];

function manageCats() {
  let grassHeight = height / 2;
  if (fluffyValue > 0) {
    if (activeCats.length === 0) {
      let newCat = {
        x: random(60, width - 200),
        y: random(grassHeight, height - 200),
        alpha: 0,
        fadeSpeed: map(fluffyValue, 0, 1, 0.01, 0.03),
        state: "fadeIn", // 'fadeIn' or 'stay' or 'fadeOut'
        timer: 0,
        stayDuration: int(map(fluffyValue, 0, 1, 300, 200)),
        element: createCatElement(
          random(60, width - 60),
          random(grassHeight, height - 100)
        ),
      };
      activeCats.push(newCat);
    }
  } else {
    //fluffyValue <= 0
    for (let i = activeCats.length - 1; i >= 0; i--) {
      let cat = activeCats[i];
      cat.element.remove();
      activeCats.splice(i, 1);
    }
  }

  // UPDATE IMAGES
  for (let i = activeCats.length - 1; i >= 0; i--) {
    let cat = activeCats[i];

    if (cat.state === "fadeIn") {
      cat.alpha += cat.fadeSpeed;
      if (cat.alpha >= 1) {
        cat.alpha = 1;
        cat.state = "stay";
        cat.timer = 0;
      }
    } else if (cat.state === "stay") {
      cat.timer++;
      if (cat.timer >= cat.stayDuration) {
        cat.state = "fadeOut";
      }
    } else if (cat.state === "fadeOut") {
      cat.alpha -= cat.fadeSpeed;
      if (cat.alpha <= 0) {
        cat.element.remove();
        activeCats.splice(i, 1);
        continue;
      }
    }

    // UPDATE ALPHA
    if (cat.element) {
      cat.element.style.opacity = cat.alpha;
    }
  }
}

function createCatElement(x, y) {
  const container = document.getElementById("gif-container");
  const img = document.createElement("img");

  // Exclude recently used images from catImages
  const availableImages = catImages.filter(
    (imgPath) => !recentImages.includes(imgPath)
  );

  // Randomly select an available image
  const randomImage =
    availableImages[Math.floor(Math.random() * availableImages.length)];

  // Update the most recently used image records
  recentImages.push(randomImage);
  if (recentImages.length > 2) {
    recentImages.shift(); // Keep the number of images in the record to no more than 2
  }

  img.src = randomImage;
  img.className = "cat-image";
  img.style.position = "absolute";
  img.style.left = `${x}px`;
  img.style.top = `${y}px`;
  img.style.width = "100px";
  img.style.height = "100px";
  img.style.opacity = "0";
  img.style.transition = "opacity 0.5s";
  container.appendChild(img);

  return img;
}

function mousePressed() {
  bubbles.push(new Bubble(mouseX, mouseY));
}

function manageBubbles() {
  let targetBubbles = int(map(sleepyValue, 0, 1, 0, 7));

  // If the number of bubbles is insufficient, add more bubbles
  while (bubbles.length < targetBubbles) {
    bubbles.push(new Bubble(random(width), random(400, height + 100)));
  }

  // If there are too many bubbles, remove the extra bubbles.
  while (bubbles.length > targetBubbles) {
    bubbles.pop(); // Delete the last bubble
  }
}

class Bubble {
  constructor(tempx, tempy) {
    this.x = tempx;
    this.y = tempy;
    this.size = random(30, 60);
    this.baseAlpha = random(80, 160);

    // 蓝绿色系主调
    this.r = random(100, 150);
    this.g = random(200, 255);
    this.b = random(220, 255);

    this.alpha = this.baseAlpha;
    this.fadeIn = true;
  }

  move() {
    this.x += random(-1, 1);
    this.y += random(-1.5, -1);

    // If the bubble moves off the top of the screen, it regenerates at the bottom
    if (this.y < -this.size) {
      this.y = random(height, height + 100);
    }

    // If the bubble moves out of the left or right border of the screen, enter from the other side
    if (this.x > width) {
      this.x = 0;
    }
    if (this.x < 0) {
      this.x = width;
    }

    // Simulate the flashing effect of bubbles
    if (this.fadeIn) {
      this.alpha += 1;
      if (this.alpha >= this.baseAlpha + 30) this.fadeIn = false;
    } else {
      this.alpha -= 1;
      if (this.alpha <= this.baseAlpha) this.fadeIn = true;
    }
  }

  show() {
    noStroke();
    fill(this.r, this.g, this.b, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
}
