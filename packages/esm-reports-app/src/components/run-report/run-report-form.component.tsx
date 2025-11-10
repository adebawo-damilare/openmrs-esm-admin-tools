import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, ButtonSet, Form, Select, SelectItem } from '@carbon/react';
import classNames from 'classnames';
import { take } from 'rxjs/operators';
import { useTranslation } from 'react-i18next';
import { showSnackbar, useLayoutType } from '@openmrs/esm-framework';
import ReportParameter from '../report-parameter.component';
import { closeOverlay } from '../../hooks/useOverlay';
import {
  useLocations,
  useReportDefinitions,
  useReportDesigns,
  runReportObservable,
  useNmrsCategories,
} from '../reports.resource';
import styles from './run-report-form.scss';

interface RunReportForm {
  closePanel: () => void;
}

const RunReportForm: React.FC<RunReportForm> = ({ closePanel }) => {
  const { t } = useTranslation();
  const [reportUuid, setReportUuid] = useState('');
  const [renderModeUuid, setRenderModeUuid] = useState('');
  const [currentReport, setCurrentReport] = useState(null);
  const [reportParameters, setReportParameters] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const isTablet = useLayoutType() === 'tablet';

  const { reportDesigns, mutateReportDesigns } = useReportDesigns(reportUuid);
  const { reportDefinitions } = useReportDefinitions();
  const { categories } = useNmrsCategories();
  const { locations } = useLocations();

  const filteredReportDefinitions = useMemo(() => {
    if (!selectedCategory || !categories || !categories[selectedCategory]) {
      return reportDefinitions;
    }
    const categoryReportUuids = categories[selectedCategory].map((report: any) => report.uuid);
    return reportDefinitions?.filter((report) => categoryReportUuids.includes(report.uuid));
  }, [selectedCategory, categories, reportDefinitions]);

  const supportedParameterTypes = useMemo(
    () => [
      'java.util.Date',
      'java.lang.String',
      'java.lang.Integer',
      'org.openmrs.Location',
      'org.openmrs.Concept',
      'org.openmrs.EncounterType',
    ],
    [],
  );

  useEffect(() => {
    mutateReportDesigns();
  }, [mutateReportDesigns, reportUuid]);

  useEffect(() => {
    const paramTypes = currentReport?.parameters.map((param) => param.type);

    const isAnyNotSupportedType =
      paramTypes?.some((paramType) => !supportedParameterTypes.includes(paramType)) ?? false;
    const allRequiredParametersValid =
      currentReport?.parameters?.every((parameter) => {
        if (!parameter.required) {
          return true;
        }

        const paramValue = reportParameters[parameter.name];
        const isValid = !!paramValue && paramValue !== 'Invalid Date' && paramValue !== '';
        return isValid;
      }) ?? true;

    if (!isAnyNotSupportedType && allRequiredParametersValid && reportUuid !== '' && renderModeUuid !== '') {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [reportParameters, reportUuid, renderModeUuid, currentReport?.parameters, supportedParameterTypes]);

  function handleOnChange(event) {
    const key = event.target.name;
    let value = null;
    if (event.target.type === 'checkbox') {
      value = event.target.checked;
    } else {
      value = event.target.value;
    }

    setReportParameters((state) => ({ ...state, [key]: value }));
  }

  function handleOnDateChange(fieldName, dateValue) {
    setReportParameters((state) => ({ ...state, [fieldName]: dateValue }));
  }

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      setIsSubmitting(true);

      const reportRequest = {
        uuid: null,
        reportDefinition: {
          parameterizable: {
            uuid: reportUuid,
          },
          parameterMappings: reportParameters,
        },
        renderingMode: {
          argument: renderModeUuid,
        },
        schedule: null,
      };

      runReportObservable(reportRequest)
        .pipe(take(1))
        .subscribe(
          () => {
            // delayed handling because runReport returns before new reports is accessible via GET
            setTimeout(() => {
              showSnackbar({
                kind: 'success',
                title: t('reportRanSuccessfully', 'Report ran successfully'),
              });
              closePanel();
              setIsSubmitting(false);
            }, 500);
          },
          (error) => {
            console.error(error);
            showSnackbar({
              kind: 'error',
              title: t('errorRunningReport', 'Error running report'),
              subtitle: error?.message,
            });
            setIsSubmitting(false);
          },
        );
    },
    [closePanel, reportParameters, reportUuid, renderModeUuid, t],
  );

  return (
    <Form className={styles.desktopRunReport} onSubmit={handleSubmit}>
      <div className={styles.runReportInnerDivElement}>
        <Select
          id="category-filter-select"
          className={styles.basicInputElement}
          labelText={t('selectCategory', 'Filter by Category')}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setReportUuid('');
            setRenderModeUuid('');
            setCurrentReport(null);
            setReportParameters({});
          }}
          value={selectedCategory}
        >
          <SelectItem text={t('allCategories', 'All Categories')} value="" />
          <SelectItem text={t('monitoring', 'Monitoring')} value="monitoring" />
          <SelectItem text={t('dataQuality', 'Data Quality')} value="dataQuality" />
          <SelectItem text={t('biometric', 'Biometric')} value="biometric" />
          <SelectItem text={t('other', 'Other')} value="other" />
        </Select>
      </div>
      <div className={styles.runReportInnerDivElement}>
        <Select
          id="select-report"
          className={styles.basicInputElement}
          labelText={t('selectReportLabel', 'Report')}
          onChange={(e) => {
            setReportUuid(e.target.value);
            setRenderModeUuid('');
            setCurrentReport(
              filteredReportDefinitions.find((reportDefinition) => reportDefinition.uuid === e.target.value),
            );
            setReportParameters({});
          }}
          value={reportUuid}
        >
          <SelectItem text="" value={''} />
          {filteredReportDefinitions?.map((reportDefinition) => (
            <SelectItem key={reportDefinition.uuid} text={reportDefinition.name} value={reportDefinition.uuid}>
              {reportDefinition.name}
            </SelectItem>
          ))}
        </Select>
      </div>
      <div id="reportParametersDiv" className={styles.runReportInnerDivElement}>
        {currentReport?.parameters?.map((parameter) => {
          return parameter.type === 'java.util.Date' ? (
            <ReportParameter
              key={parameter.name + reportUuid}
              parameter={parameter}
              reportUuid={reportUuid}
              reportParameters={reportParameters}
              locations={locations}
              handleOnDateChange={handleOnDateChange}
              handleOnChange={undefined}
            />
          ) : (
            <ReportParameter
              key={parameter.name + reportUuid}
              parameter={parameter}
              reportUuid={reportUuid}
              reportParameters={reportParameters}
              locations={locations}
              handleOnChange={handleOnChange}
              handleOnDateChange={undefined}
            />
          );
        })}
      </div>
      <div className={styles.outputFormatDiv}>
        <Select
          id="output-format-select"
          className={styles.basicInputElement}
          labelText={t('outputFormat', 'Output format')}
          onChange={(e) => setRenderModeUuid(e.target.value)}
          value={renderModeUuid}
        >
          <SelectItem text="" value={''} />
          {reportDesigns?.map((reportDesign) => (
            <SelectItem key={reportDesign.uuid} text={reportDesign.name} value={reportDesign.uuid}>
              {reportDesign.name}
            </SelectItem>
          ))}
        </Select>
      </div>
      <div className={styles.buttonsDiv}>
        <ButtonSet className={classNames({ [styles.tablet]: isTablet, [styles.desktop]: !isTablet })}>
          <Button onClick={closeOverlay} kind="secondary" size="xl" className={styles.reportButton}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button
            disabled={!isFormValid || isSubmitting}
            size="xl"
            className={styles.reportButton}
            kind="primary"
            type="submit"
          >
            {t('run', 'Run')}
          </Button>
        </ButtonSet>
      </div>
    </Form>
  );
};

export default RunReportForm;
