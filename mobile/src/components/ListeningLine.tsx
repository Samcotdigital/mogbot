/**
 * The dictation card's top line, in place of the words: no words show while
 * you talk (the waveform under it is your voice), only "● Listening · 0:42",
 * or, the moment the mic isn't hearing you, "Can't hear you · check the mic"
 * in the warning colour. While the computer writes the words out:
 * "Tidying…". The rule is the desk's (companion-protocol, listening.ts).
 *
 * It keeps its own clock, so the composer doesn't re-render while you talk.
 */
import { elapsedLabel, hearing, hearingLine } from '@shipstudio/companion-protocol';
import { useEffect, useState, type RefObject } from 'react';
import { View } from 'react-native';
import { useAccent } from '../lib/accent';
import { useColors } from '../lib/appearance';
import { PILL_DOT, space } from '../lib/theme';
import { T } from './ui';

export interface ListeningMeter {
  startedAt: number;
  lastVoiceAt: number | null;
  lastWordsAt: number | null;
}

export function newListeningMeter(now = Date.now()): ListeningMeter {
  return { startedAt: now, lastVoiceAt: null, lastWordsAt: null };
}

const TICK_MS = 250;

export function ListeningLine({
  meter,
  tidying,
}: {
  meter: RefObject<ListeningMeter>;
  tidying: boolean;
}) {
  const colors = useColors();
  const accent = useAccent();
  // What it has heard, read on the line's own clock.
  const [{ now, m }, setSeen] = useState(() => ({
    now: Date.now(),
    m: newListeningMeter(),
  }));
  useEffect(() => {
    if (tidying) return;
    const look = () => setSeen({ now: Date.now(), m: { ...meter.current } });
    const first = setTimeout(look, 0);
    const t = setInterval(look, TICK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [tidying, meter]);
  // The phone's own recogniser always runs, so words are expected.
  const warning = tidying ? null : hearingLine(hearing({ now, ...m, wordsExpected: true }), null);
  const ink = warning ? colors.accentWarning : colors.textMuted;
  const words = tidying
    ? 'Tidying…'
    : (warning ?? `Listening · ${elapsedLabel(now - m.startedAt)}`);
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.tight }}
      accessibilityLiveRegion="polite"
      accessibilityLabel={words}
      testID="dictation-line"
    >
      <View
        style={{
          width: PILL_DOT,
          height: PILL_DOT,
          borderRadius: PILL_DOT / 2,
          backgroundColor: warning ? colors.accentWarning : accent.accent,
        }}
      />
      <T variant="body" color={ink} style={{ fontVariant: ['tabular-nums'] }}>
        {words}
      </T>
    </View>
  );
}
