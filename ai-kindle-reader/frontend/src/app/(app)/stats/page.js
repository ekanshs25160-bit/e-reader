import { PageContainer } from '@/components/layout';
import { StatsScreen } from '@/features/stats';

export const metadata = {
  title: 'Stats · Flyleaf',
  description: 'Your private reading telemetry and streak history.',
};

export default function Page() {
  return (
    <PageContainer>
      <StatsScreen />
    </PageContainer>
  );
}
