import React, { useRef } from "react";
import { Animated, Image, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { SongImage } from "../types";

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const GAP_BETWEEN_IMAGES = 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type Props = {
  images: SongImage[];
};

export default function ZoomableImage({ images }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const baseWidth = screenWidth;
  const layout = images.map((img) => (img.height / img.width) * baseWidth);
  const baseHeight =
    layout.reduce((sum, h) => sum + h, 0) + GAP_BETWEEN_IMAGES * Math.max(0, images.length - 1);

  // When content is smaller than the screen along an axis, it's centered on
  // that axis (fixed position, nothing to scroll); otherwise it's clamped
  // between fully-visible-start (0) and fully-visible-end.
  const boundsFor = (currentScale: number) => {
    const w = baseWidth * currentScale;
    const h = baseHeight * currentScale;
    const x = w <= screenWidth ? (screenWidth - w) / 2 : undefined;
    const y = h <= screenHeight ? (screenHeight - h) / 2 : undefined;
    return {
      minX: x ?? screenWidth - w,
      maxX: x ?? 0,
      minY: y ?? screenHeight - h,
      maxY: y ?? 0,
    };
  };

  const initialBounds = boundsFor(1);

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(initialBounds.maxX)).current;
  const translateY = useRef(new Animated.Value(initialBounds.maxY)).current;

  const scaleValue = useRef(1);
  const savedScale = useRef(1);
  const tx = useRef(initialBounds.maxX);
  const ty = useRef(initialBounds.maxY);
  const savedTx = useRef(initialBounds.maxX);
  const savedTy = useRef(initialBounds.maxY);

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
      const resetBounds = boundsFor(next);
      const nextX = next === 1 ? resetBounds.maxX : tx.current;
      const nextY = next === 1 ? resetBounds.maxY : ty.current;
      applyPosition(next, nextX, nextY, true);
      savedTx.current = nextX;
      savedTy.current = nextY;
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
        {images.map((img, index) => (
          <View
            key={index}
            style={{
              width: baseWidth,
              height: layout[index],
              marginBottom: index < images.length - 1 ? GAP_BETWEEN_IMAGES : 0,
            }}
          >
            <Image
              source={img.source}
              style={{ width: baseWidth, height: layout[index] }}
              resizeMode="contain"
            />
          </View>
        ))}
      </Animated.View>
    </GestureDetector>
  );
}
