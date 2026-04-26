import { StyleSheet, View } from 'react-native';

import { CaseCard } from '@/components/cases/case-card';
import type { Case } from '@/types/dashboard';

interface Props {
  cases: Case[];
}

export function CaseList({ cases }: Props) {
  return (
    <View style={styles.list}>
      {cases.map((c) => (
        <CaseCard key={c.id} item={c} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 7,
  },
});
