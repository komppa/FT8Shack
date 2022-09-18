#!/bin/bash

if [ x"${EXPO_KEY_JKS}" == "x" ]; then 
     echo "Value is not assigned to a variable EXPO_KEY_JKS"
else
     echo "Value is assigned to a variable EXPO_KEY_JKS"
fi


if [ x"${EXPO_ANDROID_KEYSTORE_PASSWORD}" == "x" ]; then 
     echo "Value is not assigned to a variable EXPO_ANDROID_KEYSTORE_PASSWORD"
else
     echo "Value is assigned to a variable EXPO_ANDROID_KEYSTORE_PASSWORD"
fi


if [ x"${EXPO_ANDROID_KEY_PASSWORD}" == "x" ]; then 
     echo "Value is not assigned to a variable EXPO_ANDROID_KEY_PASSWORD"
else
     echo "Value is assigned to a variable EXPO_ANDROID_KEY_PASSWORD"
fi


if [ x"${EXPO_KEYSTORE_ALIAS}" == "x" ]; then 
     echo "Value is not assigned to a variable EXPO_KEYSTORE_ALIAS"
else
     echo "Value is assigned to a variable EXPO_KEYSTORE_ALIAS"
fi


# If artefact folder exists, delete it
if [ -d "artefact" ]; then
  echo "Artefact dir exists! Deleting it!"
  rm -rf artefact
fi
if [ -d "android" ]; then
  echo "Android dir exists! Deleting it!"
  rm -rf android
fi
if [ -d "ios" ]; then
  echo "Ios dir exists! Deleting it!"
  rm -rf ios
fi
if [ -d "node_modules" ]; then
  echo "Node_modules dir exists! Deleting it!"
  rm -rf node_modules
fi
if [ -d "/root/.gradle" ]; then
  echo "Gradle dir under root exists! Deleting it!"
  rm -rf /root/.gradle/

  if [ -d "/root/.gradle" ]; then
     echo "After deleting, still exists. Trying to delete with greater force"
     sudo rm -rf /root/.gradle/
  else
     echo "Gradle under root has been deleted 1st try"
  fi

fi

yarn install

expo export --dev --public-url http://127.0.0.1:8000

(sleep 2; echo y;) | expo prebuild




npx http-server -p 8000 dist &


(echo "$EXPO_KEY_JKS"|base64 -d) > secret_key.jks

echo "Content of the current directory "
echo $(ls)


# EXPO_ANDROID_KEYSTORE_PASSWORD=$EXPO_ANDROID_KEYSTORE_PASSWORD \
# EXPO_ANDROID_KEY_PASSWORD=$EXPO_ANDROID_KEY_PASSWORD \
turtle build:android \
--type apk --keystore-path /home/ci/project/secret_key.jks \
--keystore-alias "o+ZugHCft6ocvA==" --allow-non-https-public-url \
--public-url http://127.0.0.1:8000/android-index.json


echo "Content of the current directory after buikding with turtle"
echo $(ls)


# Create non-root folder for built apk
mkdir artefact

cp /root/expo-apps/* artefact/.

# List content of the workdir folder
echo $(ls)
echo $(pwd)

# Get confused filename and convert it to be just FT8Shack.apk
mv artefact/"$(ls -l artefact/ |grep .apk |awk '{print $9}')" artefact/FT8Shack.apk
