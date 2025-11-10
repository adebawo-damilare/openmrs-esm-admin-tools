import React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterableMultiSelect } from '@carbon/react';
import { useNmrsReportCategories } from './nmrs-reports.resource';

interface NmrsCategoryFilterProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

const NmrsCategoryFilter: React.FC<NmrsCategoryFilterProps> = ({ selectedCategories, onCategoryChange }) => {
  const { t } = useTranslation();
  const { categories, isNmrsModuleInstalled, isLoading } = useNmrsReportCategories();

  // Don't show if NMRS module is not installed
  if (!isNmrsModuleInstalled || isLoading) {
    return null;
  }

  const categoryItems = [
    {
      id: 'monitoring',
      label: t('nmrsMonitoring', 'Monitoring Reports'),
      count: categories?.monitoring?.length || 0,
    },
    {
      id: 'dataQuality',
      label: t('nmrsDataQuality', 'Data Quality Reports'),
      count: categories?.dataQuality?.length || 0,
    },
    {
      id: 'biometric',
      label: t('nmrsBiometric', 'Biometric & ID Reports'),
      count: categories?.biometric?.length || 0,
    },
  ];

  const handleSelectionChange = ({ selectedItems }) => {
    onCategoryChange(selectedItems.map((item) => item.id));
  };

  return (
    <FilterableMultiSelect
      id="nmrs-category-filter"
      titleText={t('nmrsFilterByCategory', 'Filter by NMRS Category')}
      items={categoryItems}
      itemToString={(item) => (item ? `${item.label} (${item.count})` : '')}
      initialSelectedItems={categoryItems.filter((item) => selectedCategories.includes(item.id))}
      onChange={handleSelectionChange}
      placeholder={t('nmrsSelectCategories', 'Select report categories')}
    />
  );
};

export default NmrsCategoryFilter;
