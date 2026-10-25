import { PageContainer } from '@/components/layout';
import { HomeScreen } from '@/features/home';

export const metadata = {
  title: 'Home · Flyleaf',
  description: 'Your personal library and reading progress on Flyleaf.',
};

export default function Page() {
  return (
    <PageContainer>
      <HomeScreen />
    </PageContainer>
  );
}
