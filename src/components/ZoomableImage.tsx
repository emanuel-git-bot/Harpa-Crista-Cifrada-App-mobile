import React, { useRef } from "react";
import { Animated, Image, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type Props = {
  source: number;
  naturalWidth: number;
  naturalHeight: number;
};

export default function ZoomableImage({ source, naturalWidth, naturalHeight }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const baseWidth = screenWidth;
  const baseHeight = (naturalHeight / naturalWidth) * baseWidth;

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const scaleValue = useRef(1);
  const savedScale = useRef(1);
  const tx = useRef(0);
  const ty = useRef(0);
  const savedTx = useRef(0);
  const savedTy = useRef(0);

  // Content starts fully scrolled to the top: translateY 0 shows the hymn's
  // start, and the user scrolls down (drags up) to reach the rest.
  const boundsFor = (currentScale: number) => {
    const w = baseWidth * currentScale;
    const h = baseHeight * currentScale;
    return {
      minX: Math.min(0, screenWidth - w),
      maxX: 0,
      minY: Math.min(0, screenHeight - h),
      maxY: 0,
    };
  };

  const applyPosition = (currentScale: number, nextX: number, nextY: number, animate: boolean) => {
    const b = boundsFor(currentScale);
    const clampedX = clamp(nextX, b.minX, b.maxX);
    const clampedY = clamp(nextY, b.minY, b.maxY);
    tx.current = clampedX;
    ty.current = clampedY;
    if (animate) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: clampedX, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: clampedY, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      translateX.setValue(clampedX);
      translateY.setValue(clampedY);
    }
  };

  const setScale = (nextScale: number, animate: boolean) => {
    scaleValue.current = nextScale;
    if (animate) {
      Animated.timing(scale, { toValue: nextScale, duration: 180, useNativeDriver: true }).start();
    } else {
      scale.setValue(nextScale);
    }
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      applyPosition(scaleValue.current, savedTx.current + event.translationX, savedTy.current + event.translationY, false);
    })
    .onEnd(() => {
      savedTx.current = tx.current;
      savedTy.current = ty.current;
    });

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const next = clamp(savedScale.current * event.scale, 1, MAX_SCALE);
      setScale(next, false);
      applyPosition(next, tx.current, ty.current, false);
    })
    .onEnd(() => {
      savedScale.current = scaleValue.current;
      savedTx.current = tx.current;
      savedTy.current = ty.current;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = scaleValue.current > 1 ? 1 : DOUBLE_TAP_SCALE;
      setScale(next, true);
      savedScale.current = next;
      applyPosition(next, next === 1 ? 0 : tx.current, next === 1 ? 0 : ty.current, true);
      savedTx.current = next === 1 ? 0 : tx.current;
      savedTy.current = next === 1 ? 0 : ty.current;
    });

  const composed = Gesture.Simultaneous(Gesture.Simultaneous(pinch, pan), doubleTap);

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={{
          width: baseWidth,
          height: baseHeight,
          transform: [{ translateX }, { translateY }, { scale }],
        }}
      >
        <Image
          source={source}
          style={{ width: baseWidth, height: baseHeight }}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}
