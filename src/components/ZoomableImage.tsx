import React, { useRef } from "react";
import { Animated, Image, StyleSheet, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const MAX_SCALE = 4;

export default function ZoomableImage({ source }: { source: number }) {
  const { width, height } = useWindowDimensions();

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const scaleValue = useRef(1);
  const savedScale = useRef(1);
  const translateXValue = useRef(0);
  const translateYValue = useRef(0);
  const savedTranslateX = useRef(0);
  const savedTranslateY = useRef(0);

  const reset = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    scaleValue.current = 1;
    savedScale.current = 1;
    translateXValue.current = 0;
    translateYValue.current = 0;
    savedTranslateX.current = 0;
    savedTranslateY.current = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const next = Math.min(Math.max(savedScale.current * event.scale, 1), MAX_SCALE);
      scaleValue.current = next;
      scale.setValue(next);
    })
    .onEnd(() => {
      if (scaleValue.current < 1.05) {
        reset();
      } else {
        savedScale.current = scaleValue.current;
      }
    });

  const pan = Gesture.Pan()
    .minPointers(2)
    .onUpdate((event) => {
      if (scaleValue.current <= 1) return;
      const nextX = savedTranslateX.current + event.translationX;
      const nextY = savedTranslateY.current + event.translationY;
      translateXValue.current = nextX;
      translateYValue.current = nextY;
      translateX.setValue(nextX);
      translateY.setValue(nextY);
    })
    .onEnd(() => {
      savedTranslateX.current = translateXValue.current;
      savedTranslateY.current = translateYValue.current;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scaleValue.current > 1) {
        reset();
      } else {
        scaleValue.current = 2.5;
        savedScale.current = 2.5;
        Animated.timing(scale, { toValue: 2.5, duration: 200, useNativeDriver: true }).start();
      }
    });

  const composed = Gesture.Simultaneous(Gesture.Simultaneous(pinch, pan), doubleTap);

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          { width, height },
          styles.center,
          { transform: [{ translateX }, { translateY }, { scale }] },
        ]}
      >
        <Image source={source} style={{ width, height }} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
