import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

function subscribe() {
  return () => {};
}

export function useColorScheme() {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const colorScheme = useRNColorScheme();

  return isClient ? colorScheme : 'light';
}
