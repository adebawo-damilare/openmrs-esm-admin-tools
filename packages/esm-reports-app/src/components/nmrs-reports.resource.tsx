import { openmrsFetch } from '@openmrs/esm-framework';
import useSWR from 'swr';

export interface NmrsReportCategory {
  monitoring: NmrsReportInfo[];
  dataQuality: NmrsReportInfo[];
  biometric: NmrsReportInfo[];
  other: NmrsReportInfo[];
}

export interface NmrsReportInfo {
  uuid: string;
  name: string;
  description: string;
  category: string;
  parameterCount: number;
}

export interface NmrsMetadata {
  moduleName: string;
  moduleVersion: string;
  totalReports: number;
  categoryCounts: {
    monitoring: number;
    dataQuality: number;
    biometric: number;
    other: number;
  };
}

/**
 * Hook to fetch NMRS report categories
 */
export function useNmrsReportCategories() {
  const apiUrl = `/ws/rest/v1/nmrsreports/categories`;

  const { data, error, isLoading, mutate } = useSWR<{ data: { categories: NmrsReportCategory } }, Error>(
    apiUrl,
    openmrsFetch,
    {
      // Don't revalidate if NMRS module is not installed
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    },
  );

  return {
    categories: data?.data?.categories,
    error,
    isLoading,
    isNmrsModuleInstalled: !error && data?.data?.categories !== undefined,
    mutate,
  };
}

/**
 * Hook to fetch reports by NMRS category
 */
export function useNmrsReportsByCategory(category: 'monitoring' | 'dataQuality' | 'biometric') {
  const apiUrl = category ? `/ws/rest/v1/nmrsreports/category?type=${category}` : null;

  const { data, error, isLoading, mutate } = useSWR<
    { data: { reports: NmrsReportInfo[]; count: number; category: string } },
    Error
  >(apiUrl, openmrsFetch, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  return {
    reports: data?.data?.reports || [],
    count: data?.data?.count || 0,
    category: data?.data?.category,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Hook to fetch NMRS module metadata
 */
export function useNmrsMetadata() {
  const apiUrl = `/ws/rest/v1/nmrsreports/metadata`;

  const { data, error, isLoading } = useSWR<{ data: NmrsMetadata }, Error>(apiUrl, openmrsFetch, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  return {
    metadata: data?.data,
    error,
    isLoading,
    isNmrsModuleInstalled: !error && data?.data !== undefined,
  };
}
