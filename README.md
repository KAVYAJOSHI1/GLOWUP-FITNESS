# GlowUp Fitness 🌟

GlowUp Fitness is a comprehensive React Native mobile application designed to help users track their daily fitness routines, monitor their physical activity, and stay on top of their health goals.

## Features

- 🚶‍♂️ **Real-time Pedometer**: Tracks your daily steps accurately in real-time using device sensors.
- ⏰ **Task-Based Notifications**: Precise, scheduled notifications to remind you of your workout routines and daily tasks.
- 📊 **Statistics & Progress**: Monitor your performance over time with visual progress rings and detailed stats.
- 🏋️‍♀️ **Custom Workouts**: Manage your own customized fitness routines and tasks.
- ⚙️ **Customizable Profile**: Personalized user profile and settings to cater to your specific goals.

## Tech Stack

- **Framework**: React Native (Expo)
- **Language**: JavaScript
- **Storage**: AsyncStorage for local data persistence
- **Sensors**: Expo Sensors (Pedometer)
- **Notifications**: Expo Notifications

## Installation

### Prerequisites
- Node.js and npm installed
- React Native CLI or Expo CLI
- Android Studio or an Android device for testing

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/KAVYAJOSHI1/GLOWUP-FITNESS.git
   ```

2. Navigate to the app directory:
   ```bash
   cd GLOWUP-FITNESS/app
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. Run the application:
   ```bash
   npm start
   ```

## Building for Android (Release APK)

To generate a standalone production-ready Android build:
```bash
cd app
# Using Expo CLI to build the APK
npx expo build:android -t apk
```

## Contributing

Feel free to fork the repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.
