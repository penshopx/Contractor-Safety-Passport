import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

type Point = { x: number; y: number };

export function SignaturePad({ onChange }: { onChange: (svg: string | undefined) => void }) {
  const colors = useColors();
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const activeStroke = useRef<Point[]>([]);

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const { locationX, locationY } = event.nativeEvent;
      activeStroke.current = [{ x: locationX, y: locationY }];
      setStrokes((current) => [...current, activeStroke.current]);
    },
    onPanResponderMove: (event) => {
      const { locationX, locationY } = event.nativeEvent;
      activeStroke.current.push({ x: locationX, y: locationY });
      setStrokes((current) => [...current.slice(0, -1), [...activeStroke.current]]);
    },
    onPanResponderRelease: () => {
      const paths = strokes.concat([activeStroke.current]).filter((stroke) => stroke.length > 1);
      const polylines = paths.map((stroke) => `<polyline points="${stroke.map((point) => `${point.x},${point.y}`).join(' ')}" fill="none" stroke="#FAFAFA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
      onChange(polylines ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150">${polylines}</svg>` : undefined);
    },
  }), [onChange, strokes]);

  return (
    <View style={[styles.pad, { backgroundColor: colors.background, borderColor: colors.border }]} {...responder.panHandlers}>
      {strokes.length === 0 ? <Text style={[styles.hint, { color: colors.mutedForeground }]}>Tanda tangan di area ini</Text> : null}
      <Svg style={StyleSheet.absoluteFill}>
        {strokes.map((stroke, index) => (
          <Polyline key={index} points={stroke.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={colors.foreground} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { height: 150, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  hint: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13 },
});