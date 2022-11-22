import { memo } from 'react';

import FusePoolList from '@ui/components/pages/PoolsPage/FusePoolList';
import FuseStatsBar from '@ui/components/pages/PoolsPage/FuseStatsBar';
import FusePageLayout from '@ui/components/pages/Layout/FusePageLayout';
import PageTransitionLayout from '@ui/components/shared/PageTransitionLayout';

const FusePoolsPage = memo(() => {
  return (
    <PageTransitionLayout>
      <FusePageLayout>
        <FuseStatsBar />
        <FusePoolList />
      </FusePageLayout>
    </PageTransitionLayout>
  );
});

export default FusePoolsPage;
