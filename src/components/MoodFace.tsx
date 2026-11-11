import Svg, { Circle, Path } from 'react-native-svg';
import { colors, moods, type MoodValue } from '@/lib/theme';

export function MoodFace({ value, size = 44 }: { value: MoodValue; size?: number }) {
  const m = moods.find((x) => x.value === value)!;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="23" fill={m.color} />
      <Circle cx="18" cy="21" r="2.4" fill={colors.plumDeep} />
      <Circle cx="30" cy="21" r="2.4" fill={colors.plumDeep} />
      <Path d={m.mouth} fill="none" stroke={colors.plumDeep} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}
