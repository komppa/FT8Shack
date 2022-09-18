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
  echo "Artefact dir existed! Deleting it!"
  rm -rf artefact
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
--keystore-alias "$(echo $EXPO_KEYSTORE_ALIAS)" --allow-non-https-public-url \
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
