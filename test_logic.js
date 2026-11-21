// Test the finger counting logic without camera
console.log('Testing Hand Number Counter Logic');
console.log('==================================\n');

// Simulate realistic hand landmarks for different finger configurations
// Handpose model returns landmarks as [x, y, z] where y=0 is top of image
// Wrist (0), Thumb (1-4), Index (5-8), Middle (9-12), Ring (13-16), Pinky (17-20)
// For extended fingers: tip y < joint y (since y increases downward)

const testCases = [
    { name: 'Closed fist (0 fingers)', generator: generateFistLandmarks, expected: 0 },
    { name: 'One finger up (1 finger)', generator: generateOneFingerLandmarks, expected: 1 },
    { name: 'Two fingers (2 fingers)', generator: generateTwoFingersLandmarks, expected: 2 },
    { name: 'Three fingers (3 fingers)', generator: generateThreeFingersLandmarks, expected: 3 },
    { name: 'Four fingers (4 fingers)', generator: generateFourFingersLandmarks, expected: 4 },
    { name: 'Five fingers spread (5 fingers)', generator: generateFiveFingersLandmarks, expected: 5 }
];

// Generate realistic hand landmarks
// Base hand position: wrist at (320, 400), fingers pointing up
function generateBaseHand() {
    // Returns array of 21 [x, y] points
    // Wrist at bottom center
    const landmarks = [];

    // Wrist (0)
    landmarks[0] = [320, 420];

    // Thumb (1-4) - on left side of hand
    // Joints: base/MCP (1), knuckle/CMC (2), mid/IP (3), tip (4)
    landmarks[1] = [280, 380]; // base/MCP
    landmarks[2] = [260, 340]; // knuckle/CMC
    landmarks[3] = [240, 300]; // mid/IP
    landmarks[4] = [220, 260]; // tip - extended by default

    // Index finger (5-8) - base at (320, 360)
    // 5: MCP, 6: PIP, 7: DIP, 8: TIP
    landmarks[5] = [300, 360]; // base/MCP
    landmarks[6] = [295, 310]; // joint/PIP
    landmarks[7] = [290, 260]; // mid/DIP
    landmarks[8] = [285, 210]; // tip - extended

    // Middle finger (9-12) - base at (320, 360)
    // 9: MCP, 10: PIP, 11: DIP, 12: TIP
    landmarks[9] = [320, 360]; // base/MCP
    landmarks[10] = [320, 310]; // joint/PIP
    landmarks[11] = [320, 260]; // mid/DIP
    landmarks[12] = [320, 210]; // tip - extended

    // Ring finger (13-16) - base at (340, 360)
    // 13: MCP, 14: PIP, 15: DIP, 16: TIP
    landmarks[13] = [340, 360]; // base/MCP
    landmarks[14] = [345, 310]; // joint/PIP
    landmarks[15] = [350, 260]; // mid/DIP
    landmarks[16] = [355, 210]; // tip - extended

    // Pinky (17-20) - base at (360, 360)
    // 17: MCP, 18: PIP, 19: DIP, 20: TIP
    landmarks[17] = [360, 360]; // base/MCP
    landmarks[18] = [370, 310]; // joint/PIP
    landmarks[19] = [380, 260]; // mid/DIP
    landmarks[20] = [390, 210]; // tip - extended

    return landmarks;
}

// Helper to create a fist (curl fingers down)
function curlFinger(landmarks, fingerName) {
    const fingerIndices = {
        // For thumb: [mcp, ip, tip] - angle uses [mcp (base), ip (joint), tip]
        thumb: [2, 3, 4],
        // For fingers: [base (mcp), pip (joint), dip, tip]
        // Angle uses [base, pip (joint), tip] - so modify pip, dip, tip
        index: [5, 6, 7, 8],
        middle: [9, 10, 11, 12],
        ring: [13, 14, 15, 16],
        pinky: [17, 18, 19, 20]
    };

    const indices = fingerIndices[fingerName];
    if (!indices) return;

    if (fingerName === 'thumb') {
        // Thumb: angle at mcp (indices[0]), using ip (indices[1]) and tip (indices[2])
        // mcp at [260, 340]. Need angle < 90.
        // Create a bent thumb folded into palm: ip goes left, tip goes back toward palm (down/right)
        const mcp = landmarks[indices[0]]; // [260, 340]
        // ip goes left and slightly up from mcp
        landmarks[indices[1]] = [mcp[0] - 20, mcp[1] - 10];
        // tip folds back toward palm - creates acute angle at mcp
        landmarks[indices[2]] = [mcp[0] - 10, mcp[1] + 30];
        console.log('Thumb curl set:', landmarks[indices[0]], landmarks[indices[1]], landmarks[indices[2]]);
    } else {
        // Other fingers: angle at base (index 0), using pip (index 1) and tip (index 3)
        // Make tip below pip (y increases)
        const pip = landmarks[indices[1]];
        landmarks[indices[2]] = [pip[0], pip[1] + 30]; // dip
        landmarks[indices[3]] = [pip[0], pip[1] + 60]; // tip - curled down
    }
}

function generateFistLandmarks() {
    const landmarks = generateBaseHand();
    // Curl all fingers
    ['index', 'middle', 'ring', 'pinky'].forEach(f => curlFinger(landmarks, f));
    // Curl thumb too
    curlFinger(landmarks, 'thumb');
    // Verify thumb curl
    console.log('Thumb after curl:', landmarks[2], landmarks[3], landmarks[4]);
    return landmarks;
}

function generateOneFingerLandmarks() {
    const landmarks = generateBaseHand();
    // Curl all except index
    ['middle', 'ring', 'pinky'].forEach(f => curlFinger(landmarks, f));
    curlFinger(landmarks, 'thumb');
    return landmarks;
}

function generateTwoFingersLandmarks() {
    const landmarks = generateBaseHand();
    // Curl all except index and middle
    ['ring', 'pinky'].forEach(f => curlFinger(landmarks, f));
    curlFinger(landmarks, 'thumb');
    return landmarks;
}

function generateThreeFingersLandmarks() {
    const landmarks = generateBaseHand();
    // Curl all except index, middle, ring
    ['pinky'].forEach(f => curlFinger(landmarks, f));
    curlFinger(landmarks, 'thumb');
    return landmarks;
}

function generateFourFingersLandmarks() {
    const landmarks = generateBaseHand();
    // Curl pinky only (thumb stays extended for 4 fingers)
    curlFinger(landmarks, 'pinky');
    return landmarks;
}

function generateFiveFingersLandmarks() {
    // All fingers extended including thumb
    return generateBaseHand();
}

// DEBUG: Test specific case
function debugCountFingers() {
    console.log('\n=== DEBUG: Five Fingers ===');
    const landmarks = generateFiveFingersLandmarks();

    // Print all landmarks
    landmarks.forEach((p, i) => console.log(`  ${i}: [${p[0]}, ${p[1]}]`));

    const fingerTips = [4, 8, 12, 16, 20];
    const fingerJoints = [3, 6, 10, 14, 18];
    const fingerBases = [2, 5, 9, 13, 17]; // Correct bases

    console.log('\nThumb:');
    const thumbTip = landmarks[4];
    const thumbJoint = landmarks[3];
    const thumbBase = landmarks[2];
    console.log(`  Base: [${thumbBase[0]}, ${thumbBase[1]}]`);
    console.log(`  Joint: [${thumbJoint[0]}, ${thumbJoint[1]}]`);
    console.log(`  Tip: [${thumbTip[0]}, ${thumbTip[1]}]`);
    const thumbAngle = calculateAngle(thumbBase, thumbJoint, thumbTip);
    console.log(`  Angle: ${thumbAngle.toFixed(1)}°`);
    console.log(`  Counted: ${thumbAngle > 90 ? 'YES' : 'NO'}`);

    for (let i = 1; i < 5; i++) {
        const tip = landmarks[fingerTips[i]];
        const joint = landmarks[fingerJoints[i]];
        const base = landmarks[fingerBases[i]]; // Use correct base

        console.log(`\nFinger ${i} (${['Index', 'Middle', 'Ring', 'Pinky'][i-1]}):`);
        console.log(`  Base (${fingerBases[i]}): [${base[0]}, ${base[1]}]`);
        console.log(`  Joint (${fingerJoints[i]}): [${joint[0]}, ${joint[1]}]`);
        console.log(`  Tip (${fingerTips[i]}): [${tip[0]}, ${tip[1]}]`);
        console.log(`  Tip.y < Joint.y: ${tip[1] < joint[1] ? 'YES' : 'NO'} (${tip[1]} < ${joint[1]})`);

        const angle = calculateAngle(base, joint, tip);
        console.log(`  Angle: ${angle.toFixed(1)}°`);
        console.log(`  Counted: ${tip[1] < joint[1] && angle > 90 ? 'YES' : 'NO'}`);
    }

    // Also test fist
    console.log('\n\n=== DEBUG: Fist ===');
    const fistLandmarks = generateFistLandmarks();
    console.log('Thumb landmarks:');
    console.log(`  Base (2): [${fistLandmarks[2][0]}, ${fistLandmarks[2][1]}]`);
    console.log(`  Joint (3): [${fistLandmarks[3][0]}, ${fistLandmarks[3][1]}]`);
    console.log(`  Tip (4): [${fistLandmarks[4][0]}, ${fistLandmarks[4][1]}]`);
    const fistThumbAngle = calculateAngle(fistLandmarks[2], fistLandmarks[3], fistLandmarks[4]);
    console.log(`  Angle: ${fistThumbAngle.toFixed(1)}°`);
    console.log(`  Counted: ${fistThumbAngle > 90 ? 'YES' : 'NO'}`);

    for (let i = 1; i < 5; i++) {
        const tip = fistLandmarks[fingerTips[i]];
        const joint = fistLandmarks[fingerJoints[i]];
        console.log(`Finger ${i}: Tip.y=${tip[1]}, Joint.y=${joint[1]}, Tip<Joint: ${tip[1] < joint[1] ? 'YES' : 'NO'}`);
    }
}

// Test the countFingers function
function testCountFingers() {
    console.log('Running finger detection tests...\n');

    let passed = 0;
    let failed = 0;

    testCases.forEach(testCase => {
        const landmarks = testCase.generator();
        const result = countFingers(landmarks);

        const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
        if (result === testCase.expected) {
            passed++;
        } else {
            failed++;
        }

        console.log(`${status}: ${testCase.name}`);
        console.log(`   Expected: ${testCase.expected}, Got: ${result}\n`);
    });

    console.log('Test Summary:');
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total:  ${testCases.length}`);

    return failed === 0;
}

// Finger counting algorithm (copy from app.js)
function calculateAngle(a, b, c) {
    const ab = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
    const bc = Math.sqrt(Math.pow(b[0] - c[0], 2) + Math.pow(b[1] - c[1], 2));
    const ac = Math.sqrt(Math.pow(c[0] - a[0], 2) + Math.pow(c[1] - a[1], 2));

    // Law of cosines
    return Math.acos((ab * ab + bc * bc - ac * ac) / (2 * ab * bc)) * (180 / Math.PI);
}

function countFingers(landmarks) {
    if (!landmarks || landmarks.length < 21) return 0;

    const fingerTips = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky tips
    const fingerJoints = [3, 6, 10, 14, 18]; // thumb IP, index PIP, middle PIP, ring PIP, pinky PIP
    const fingerBases = [2, 5, 9, 13, 17]; // thumb MCP, index MCP, middle MCP, ring MCP, pinky MCP
    let count = 0;

    // Thumb is special - check angle between base, joint, tip
    const thumbTip = landmarks[4];
    const thumbJoint = landmarks[3];
    const thumbBase = landmarks[2];

    const thumbAngle = calculateAngle(thumbBase, thumbJoint, thumbTip);
    if (thumbAngle > 90) count++;

    // Other fingers - check if tip is above joint
    for (let i = 1; i < 5; i++) {
        const tip = landmarks[fingerTips[i]];
        const joint = landmarks[fingerJoints[i]];
        const base = landmarks[fingerBases[i]]; // Fixed: use proper base index

        const angle = calculateAngle(base, joint, tip);

        // If finger is raised (tip y < joint y = higher in image) and angle > 90
        if (tip[1] < joint[1] && angle > 90) {
            count++;
        }
    }

    return Math.min(count, 5); // Max 5 fingers
}

// Run debug first
debugCountFingers();

// Run tests
testCountFingers();