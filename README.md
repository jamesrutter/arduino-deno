# 🦖 Arduino Deno (ArDeno) 
This project illustrates how you can utilize Deno with Arduino projects. The motivation is to create fun IoT and creative projects for artists, makers, and beginners. 

## Background & Motivations 

### Why Deno? 
I am focusing this project on Deno because it is a great platform for serverless and cloud-based functions. This makes it very easy (and sometimes free) to create an API with some Arduino sensors. Deno Deploy has a generous free tier that allows you to quickly deploy Deno applications via Github CI/CD workflow, which is a great experience. Git commit + push, and your live deployed application on the wild internet gets automatically updated. 🤯

### Arduino Development with PlatformIO 
Rather than use the conventional IDE that ships with the Arduino platform, I am also choosing to develop these project examples with PlatformIO. This is a powerful toolkit that allows you to develop Arduino projects from within VS Code, which is arguably the most powerful open-source code editor around. You can use all your favorite plugins such as Github Copilot, while also having robust support for the Arduino development toolkit. 

### ArduinoIDE
If this project goes anywhere, I will develop examples in the native Arduino IDE for those that find this experience more straightforward. I realize that not everyone is up for as powerful of a tool as VS Code + PlatformIO and that starting with a dedicated tool for the job is more approachable for beginners. 

## Examples & Projects 

### Web Sockets 
The first project example is an implementation of web sockets. The Deno app provides a web socket server that the Arduino (ESP32C3) connects to and begins sending sensor data in realtime. This could be used for all sorts of projects, my hope is that we use it for machine control and feedback. 

### UDP
This module implements UDP communication from the ESP32-C3 board to send its joystick data in real-time. UDP is extremely fast and has low overhead. 
- ⚠️ Is not currently supported on Deno Deploy. 


## Getting Started: Running the Application 
For local development: 
```
deno task dev 
```
For production (Deno Deploy):
```
deno task start
```