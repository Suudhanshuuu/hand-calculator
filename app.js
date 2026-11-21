// Hand Number Counter App - Using MediaPipe Hands (much more accurate)
// Auto-confirms after holding same fingers for 2 seconds
let hands;
let video;
let canvas;
let ctx;
let camera;
let isRunning = false;
let targetCount = 0;
let currentIndex = 0;
let detectedNumbers = [];
let lastDetectedFingers = -1;
let stableCount = 0;
let holdStartTime = 0;
const STABILITY_THRESHOLD = 8; // frames of consistent detection
const HOLD_DURATION = 1000; // 1 second in ms

// UI elements
const setupScreen = document.getElementById('setup-screen');
const appScreen = document.getElementById('app-screen');
const targetCountInput = document.getElementById('targetCount');
const startSessionBtn = document.getElementById('startSessionBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const detectionStatus = document.getElementById('detection-status');
const currentTarget = document.getElementById('current-target');
const stabilityIndicator = document.getElementById('stability-indicator');
const resultDiv = document.getElementById('result');
const historyDiv = document.getElementById('history');
const holdTimerContainer = document.getElementById('hold-timer-container');
const holdTimerFill = document.getElementById('hold-timer-fill');
const holdText = document.getElementById('hold-text');

// Initialize MediaPipe Hands
async function init() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = 640;
    canvas.height = 480;

    resultDiv.textContent = 'Loading MediaPipe Hands model...';

    try {
        // Initialize MediaPipe Hands
        hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        hands.onResults(onResults);

        console.log('MediaPipe Hands loaded successfully!');
        resultDiv.textContent = '✅ Model ready! Enter count and start.';

        setupEventListeners();
    } catch (err) {
        console.error('Failed to load model:', err);
        resultDiv.innerHTML = `❌ <strong>Error:</strong> ${err.message}<br><small>Please refresh the page.</small>`;
    }
}

function setupEventListeners() {
    startSessionBtn.addEventListener('click', startSession);
    stopBtn.addEventListener('click', stopSession);
    resetBtn.addEventListener('click', resetSession);
}

function startSession() {
    const count = parseInt(targetCountInput.value);
    if (isNaN(count) || count < 1 || count > 10) {
        alert('Please enter a number between 1 and 10');
        return;
    }

    targetCount = count;
    currentIndex = 0;
    detectedNumbers = [];

    setupScreen.style.display = 'none';
    appScreen.style.display = 'block';

    startCamera();
    updateProgress();
    updateTargetDisplay();
}

async function startCamera() {
    try {
        detectionStatus.textContent = '📹 Requesting camera access...';

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        });

        video.srcObject = stream;
        await video.play();

        // Start MediaPipe camera
        camera = new Camera(video, {
            onFrame: async () => {
                await hands.send({ image: video });
            },
            width: 640,
            height: 480
        });

        camera.start();
        isRunning = true;

        stopBtn.disabled = false;

        detectionStatus.textContent = '✅ Camera ready! Show your hand.';
    } catch (err) {
        console.error('Camera error:', err);
        detectionStatus.innerHTML = `❌ <strong>Camera Error:</strong> ${err.message}`;
    }
}

function stopSession() {
    if (camera) {
        camera.stop();
    }
    const stream = video.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    isRunning = false;
    stopBtn.disabled = true;
    detectionStatus.textContent = 'Session stopped.';
    holdTimerContainer.classList.remove('active');
    holdText.style.display = 'none';
}

function resetSession() {
    stopSession();
    appScreen.style.display = 'none';
    setupScreen.style.display = 'block';
    targetCountInput.value = '2';
    resultDiv.textContent = 'Waiting for hand...';
    historyDiv.innerHTML = '';
    lastDetectedFingers = -1;
    stableCount = 0;
    holdStartTime = 0;
    stabilityIndicator.classList.remove('stable');
    holdTimerContainer.classList.remove('active');
    holdText.style.display = 'none';
}

function onResults(results) {
    if (!isRunning) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const fingers = countFingers(landmarks);

        // Draw landmarks
        drawLandmarks(landmarks);

        // Stability check - same finger count for multiple frames
        if (fingers === lastDetectedFingers && fingers >= 0 && fingers <= 5) {
            stableCount++;
        } else {
            stableCount = 0;
            lastDetectedFingers = fingers;
            holdStartTime = 0;
            holdTimerContainer.classList.remove('active');
            holdText.style.display = 'none';
        }

        // Update stability indicator
        const isStable = stableCount >= STABILITY_THRESHOLD;
        stabilityIndicator.classList.toggle('stable', isStable);

        if (isStable) {
            // Start hold timer
            const now = Date.now();
            if (holdStartTime === 0) {
                holdStartTime = now;
                holdTimerContainer.classList.add('active');
                holdText.style.display = 'block';
            }

            const elapsed = now - holdStartTime;
            const progress = Math.min(elapsed / HOLD_DURATION, 1);
            holdTimerFill.style.width = `${progress * 100}%`;

            detectionStatus.innerHTML = `
                <span id="current-target">Detected: ${'👆'.repeat(fingers)} (${fingers})</span>
                <span id="stability-indicator" class="stability-indicator${isStable ? ' stable' : ''}"></span>
            `;

            if (progress < 1) {
                holdText.textContent = `Hold steady... ${(HOLD_DURATION - elapsed) / 1000}s`;
                resultDiv.innerHTML = `<strong>Hold for ${((HOLD_DURATION - elapsed) / 1000).toFixed(1)}s:</strong> ${fingers} ${'👆'.repeat(fingers)}`;
            } else {
                // Auto-confirm after 2 seconds
                confirmAndNext(fingers);
            }
        } else {
            // Not stable yet
            holdStartTime = 0;
            holdTimerContainer.classList.remove('active');
            holdText.style.display = 'none';
            detectionStatus.innerHTML = `
                <span id="current-target">Detected: ${'👆'.repeat(fingers)} (${fingers}) ${stableCount > 0 ? `(${stableCount}/${STABILITY_THRESHOLD})` : ''}</span>
                <span id="stability-indicator" class="stability-indicator"></span>
            `;
            resultDiv.textContent = stableCount > 0 ? 'Keep holding...' : 'Show your hand...';
        }
    } else {
        // No hand detected
        stableCount = 0;
        lastDetectedFingers = -1;
        holdStartTime = 0;
        holdTimerContainer.classList.remove('active');
        holdText.style.display = 'none';
        stabilityIndicator.classList.remove('stable');
        detectionStatus.innerHTML = `
            <span id="current-target">👋 No hand detected</span>
            <span id="stability-indicator" class="stability-indicator"></span>
        `;
        resultDiv.textContent = 'Show your hand...';
    }
}

// Count fingers using MediaPipe landmarks (21 points, same indices as handpose)
function countFingers(landmarks) {
    if (!landmarks || landmarks.length < 21) return 0;

    // MediaPipe hand landmarks (same indices as handpose):
    // 0: wrist, 1-4: thumb, 5-8: index, 9-12: middle, 13-16: ring, 17-20: pinky
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerJoints = [3, 6, 10, 14, 18]; // PIP joints
    const fingerBases = [2, 5, 9, 13, 17];   // MCP joints
    let count = 0;

    // Thumb - check angle at MCP
    const thumbTip = landmarks[4];
    const thumbJoint = landmarks[3];
    const thumbBase = landmarks[2];

    const thumbAngle = calculateAngle(thumbBase, thumbJoint, thumbTip);
    if (thumbAngle > 160) count++; // More lenient for MediaPipe

    // Other fingers - tip above PIP joint (y is normalized 0-1, 0 is top)
    for (let i = 1; i < 5; i++) {
        const tip = landmarks[fingerTips[i]];
        const joint = landmarks[fingerJoints[i]];
        const base = landmarks[fingerBases[i]];

        const angle = calculateAngle(base, joint, tip);

        // Tip above joint (lower y) and extended angle
        if (tip.y < joint.y && angle > 160) {
            count++;
        }
    }

    return Math.min(count, 5);
}

function calculateAngle(a, b, c) {
    // a, b, c are {x, y, z} objects from MediaPipe
    const ab = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    const bc = Math.sqrt(Math.pow(b.x - c.x, 2) + Math.pow(b.y - c.y, 2));
    const ac = Math.sqrt(Math.pow(c.x - a.x, 2) + Math.pow(c.y - a.y, 2));

    // Law of cosines
    const cosAngle = (ab * ab + bc * bc - ac * ac) / (2 * ab * bc);
    // Clamp to avoid NaN from floating point errors
    return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
}

function drawLandmarks(landmarks) {
    ctx.fillStyle = '#ff0000';
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;

    // Draw points
    landmarks.forEach((point) => {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Draw connections
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // index
        [0, 9], [9, 10], [10, 11], [11, 12], // middle
        [0, 13], [13, 14], [14, 15], [15, 16], // ring
        [0, 17], [17, 18], [18, 19], [19, 20]  // pinky
    ];

    connections.forEach(([start, end]) => {
        const p1 = landmarks[start];
        const p2 = landmarks[end];
        ctx.beginPath();
        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
        ctx.stroke();
    });
}

function confirmAndNext(fingers) {
    // Add to detected numbers
    detectedNumbers.push(fingers);
    currentIndex++;

    // Show toast notification
    showToast(`Number ${currentIndex}: ${fingers}`);

    // Add to history display
    const item = document.createElement('div');
    item.className = 'history-item';
    item.textContent = `Number ${currentIndex}: ${fingers}`;
    historyDiv.appendChild(item);

    // Reset hold timer
    holdStartTime = 0;
    holdTimerContainer.classList.remove('active');
    holdText.style.display = 'none';
    holdTimerFill.style.width = '0%';

    if (currentIndex >= targetCount) {
        // Session complete - show sum (progress bar hits 100%)
        updateProgress();
        const sum = detectedNumbers.reduce((a, b) => a + b, 0);
        const totalItem = document.createElement('div');
        totalItem.className = 'history-item total';
        totalItem.textContent = `Sum: ${detectedNumbers.join(' + ')} = ${sum}`;
        historyDiv.appendChild(totalItem);

        resultDiv.innerHTML = `<strong>Complete!</strong> Total: ${sum}`;
        detectionStatus.innerHTML = `<strong>Done! Sum = ${sum}</strong>`;
        stopBtn.disabled = true;

        // Show final sum toast
        setTimeout(() => showToast(`Final sum: ${sum}`, 5000), 300);
    } else {
        // Next number
        updateProgress();
        updateTargetDisplay();
        stableCount = 0;
        lastDetectedFingers = -1;
        stabilityIndicator.classList.remove('stable');
        resultDiv.textContent = 'Show your hand for next number...';
    }
}

function showToast(message, duration = 4000) {
    // Remove existing toast if any
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    // Format: "Number 1: 7" -> "Number 1: <span class='value'>7</span>"
    toast.innerHTML = message.replace(/(\d+)$/, "<span class='value'>$1</span>");
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function updateProgress() {
    const percent = (currentIndex / targetCount) * 100;
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${currentIndex} / ${targetCount}`;
}

function updateTargetDisplay() {
    const nextNum = currentIndex + 1;
    currentTarget.textContent = `Show hand for number ${nextNum} of ${targetCount}`;
}

window.addEventListener('DOMContentLoaded', init);