// static/script.js
/**
 * Establish a WebSocket connection.
 * @type {WebSocket}
 */
const ws = new WebSocket(`wss://${window.location.host}/ws`);
// const ws = new WebSocket('ws://localhost:3000/ws'); // For development

/**
 * The HTML element that represents box controlled by the joystick.
 * @type {HTMLDivElement}
 */
const box = document.getElementById('box');

/**
 * The HTML element that represents box controlled by the joystick.
 * @type {HTMLDivElement}
 */
const area = document.getElementById('area');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
};

ws.onmessage = (event) => {
  const joystick_data = JSON.parse(event.data);

  updateDivPosition(joystick_data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};

function updateDivPosition(data) {
  const max_x = area.clientWidth - box.clientWidth;
  const max_y = area.clientHeight - box.clientHeight;

  // Calculate center position
  const center_x = max_x / 2;
  const center_y = max_y / 2;

  // Calculate offset from center based on joystick input
  const offset_x = (data.x / 100) * (max_x / 2);
  const offset_y = (data.y / 100) * (max_y / 2);

  // Calculate final position
  const x = center_x + offset_x;
  const y = center_y + offset_y;

  // Ensure the box stays within the boundaries
  const bounded_x = Math.max(0, Math.min(x, max_x));
  const bounded_y = Math.max(0, Math.min(y, max_y));

  box.style.left = `${bounded_x}px`;
  box.style.top = `${bounded_y}px`;

  if (data.s) {
    box.style.backgroundColor = 'goldenrod';
  } else {
    box.style.backgroundColor = 'darksalmon';
  }
}
