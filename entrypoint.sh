#!/bin/bash

yarn install

(sleep 2; echo y;) | expo prebuild

# TODO kill? Is not strictly required
(sleep 5; echo y;) | npx http-server -p 8000 dist &


(echo "$EXPO_KEY_JKS"|base64 -d) > secret_key.jks

echo "Content of the current directory "
echo $(ls)

echo "$EXPO_KEY_JKS"
echo "$EXPO_ANDROID_KEYSTORE_PASSWORD"
echo "$EXPO_ANDROID_KEY_PASSWORD"

# EXPO_ANDROID_KEYSTORE_PASSWORD=$EXPO_ANDROID_KEYSTORE_PASSWORD \
# EXPO_ANDROID_KEY_PASSWORD=$EXPO_ANDROID_KEY_PASSWORD \
turtle build:android \
--type apk --keystore-path /home/ci/project/secret_key.jks \
--keystore-alias "keyalias" --allow-non-https-public-url \
--public-url http://127.0.0.1:8000/android-index.json

echo "$EXPO_KEY_JKS"
echo "$EXPO_ANDROID_KEYSTORE_PASSWORD"
echo "$EXPO_ANDROID_KEY_PASSWORD"


# Create non-root folder for built apk
mkdir artefact

cp /root/expo-apps/* artefact/.

# List content of the artect folder
echo "Content of the artefact folder"
echo $(ls artefact)
echo $(pwd)

# Get confused filename and convert it to be just FT8Shack.apk
mv artefact/"$(ls -l artefact/ |grep .apk |awk '{print $9}')" artefact/FT8Shack.apk
