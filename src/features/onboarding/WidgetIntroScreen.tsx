import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Button, Screen, Text, useTheme } from '@/ui';

import { useOnboardingStore } from './onboardingStore';

const STEPS = [
  'Long-press an empty spot on your home screen',
  'Tap “Widgets” and find SyncList',
  'Drag it out and pick a list',
];

const CYCLE_MS = 3600;

/**
 * A short looping animation: a finger long-presses the home screen, then a SyncList widget pops
 * in and a task gets ticked. Respects the system "reduce motion" setting.
 */
export function WidgetIntroScreen() {
  const theme = useTheme();
  const markSeen = useOnboardingStore((s) => s.markWidgetIntroSeen);
  const reduceMotion = useReducedMotion();

  const press = useSharedValue(0); // finger pulse
  const widget = useSharedValue(reduceMotion ? 1 : 0); // widget appears
  const tick = useSharedValue(reduceMotion ? 1 : 0); // first task ticked

  useEffect(() => {
    if (reduceMotion) return;
    const ease = Easing.out(Easing.cubic);
    press.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500, easing: ease }),
        withTiming(0, { duration: 300 }),
        withDelay(CYCLE_MS - 800, withTiming(0, { duration: 0 })),
      ),
      -1,
    );
    widget.value = withRepeat(
      withSequence(
        withDelay(700, withTiming(1, { duration: 450, easing: Easing.out(Easing.back(1.6)) })),
        withDelay(CYCLE_MS - 1700, withTiming(0, { duration: 550 })),
      ),
      -1,
    );
    tick.value = withRepeat(
      withSequence(
        withDelay(1600, withTiming(1, { duration: 250 })),
        withDelay(CYCLE_MS - 2400, withTiming(0, { duration: 550 })),
      ),
      -1,
    );
  }, [press, widget, tick, reduceMotion]);

  const fingerStyle = useAnimatedStyle(() => ({
    opacity: 1 - widget.value,
    transform: [{ scale: 1 + press.value * 0.35 }],
  }));
  const widgetStyle = useAnimatedStyle(() => ({
    opacity: widget.value,
    transform: [{ scale: 0.6 + widget.value * 0.4 }],
  }));
  const tickStyle = useAnimatedStyle(() => ({ opacity: tick.value }));
  const strikeStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: tick.value }] }));

  return (
    <Screen style={styles.container}>
      <View style={styles.top}>
        <Text variant="title">Add the widget</Text>
        <Text muted>Tick tasks off right from your home screen, without opening the app.</Text>
      </View>

      <View
        style={[
          styles.phone,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
        ]}
        accessible
        accessibilityLabel="Animation showing a SyncList widget being added to the home screen"
      >
        <View style={styles.iconGrid}>
          {Array.from({ length: 8 }, (_, i) => (
            <View key={i} style={[styles.appIcon, { backgroundColor: theme.colors.border }]} />
          ))}
        </View>

        <Animated.View
          style={[styles.finger, { backgroundColor: theme.colors.primary }, fingerStyle]}
        />

        <Animated.View
          style={[
            styles.widget,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
            widgetStyle,
          ]}
        >
          <Text variant="label">🛒 Groceries</Text>
          {['Milk', 'Bread', 'Eggs'].map((task, i) => (
            <View key={task} style={styles.taskRow}>
              <View style={[styles.checkbox, { borderColor: theme.colors.primary }]}>
                {i === 0 ? (
                  <Animated.View
                    style={[styles.checkFill, { backgroundColor: theme.colors.primary }, tickStyle]}
                  />
                ) : null}
              </View>
              <View>
                <Text variant="caption">{task}</Text>
                {i === 0 ? (
                  <Animated.View
                    style={[
                      styles.strike,
                      { backgroundColor: theme.colors.textMuted },
                      strikeStyle,
                    ]}
                  />
                ) : null}
              </View>
            </View>
          ))}
        </Animated.View>
      </View>

      <View style={styles.steps}>
        {STEPS.map((step, i) => (
          <View key={step} style={styles.stepRow}>
            <View style={[styles.stepNum, { backgroundColor: theme.colors.primary }]}>
              <Text variant="caption" style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
                {i + 1}
              </Text>
            </View>
            <Text style={styles.flex}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button title="Got it" onPress={() => void markSeen()} testID="widget-intro-done" />
        <Button title="Skip for now" variant="ghost" onPress={() => void markSeen()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 24, gap: 20 },
  top: { gap: 8 },
  phone: {
    alignSelf: 'center',
    width: 220,
    height: 250,
    borderRadius: 32,
    borderWidth: 2,
    padding: 18,
    overflow: 'hidden',
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  appIcon: { width: 34, height: 34, borderRadius: 10 },
  finger: {
    position: 'absolute',
    left: 95,
    top: 150,
    width: 30,
    height: 30,
    borderRadius: 15,
    opacity: 0.6,
  },
  widget: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 6,
  },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  checkFill: { flex: 1 },
  strike: { position: 'absolute', left: 0, right: 0, top: '50%', height: 1.5 },
  steps: { gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  actions: { marginTop: 'auto', gap: 8 },
});
