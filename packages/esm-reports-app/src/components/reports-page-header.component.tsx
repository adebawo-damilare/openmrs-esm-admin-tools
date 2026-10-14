import React from 'react';
import { PageHeader, PageHeaderContent } from '@openmrs/esm-framework';
import ReportsPictogram from './reports-pictogram';
import styles from './reports.scss';

const ReportsPageHeader: React.FC<{ title: string }> = ({ title }) => (
  <PageHeader className={styles.header}>
    <PageHeaderContent
      illustration={<ReportsPictogram />}
      title={
        <span role="heading" aria-level={1}>
          {title}
        </span>
      }
    />
  </PageHeader>
);

export default ReportsPageHeader;
