// types.ts

// Define an enum for message types
export enum MessageType {
  Identify = 'identify',
  Joystick = 'joystick',
  // Add other message types as needed
}

// Define a type for the client
type ClientType = 'ESP32' | 'Browser' | 'Other';

// Define an interface for the joystick data
export interface JoystickData {
  x: number;
  y: number;
  pressed: boolean;
}

// Define interfaces for different message structures
interface BaseMessage {
  type: MessageType;
  client: ClientType;
  timestamp: number;
}

export interface IdentifyMessage extends BaseMessage {
  type: MessageType.Identify;
}

export interface JoystickMessage extends BaseMessage {
  type: MessageType.Joystick;
  data: JoystickData;
}

// Union type for all possible message types
export type WebSocketMessage = IdentifyMessage | JoystickMessage;

// Function to type-guard and narrow the message type
export function isJoystickMessage(message: WebSocketMessage): message is JoystickMessage {
  return message.type === MessageType.Joystick;
}
