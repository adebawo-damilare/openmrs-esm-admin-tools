import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSWRConfig } from 'swr';
import { ModalBody, Button, ModalFooter, ModalHeader, InlineLoading } from '@carbon/react';
import { showSnackbar } from '@openmrs/esm-framework';
import { cancelActiveReportRequest, cancelReportRequest } from '../reports.resource';

interface CancelReportModalProps {
  closeModal: () => void;
  reportRequestUuid: string;
  modalType: ModalType;
}

type ModalType = 'delete' | 'cancel' | 'schedule';

const CancelReportModal: React.FC<CancelReportModalProps> = ({ closeModal, reportRequestUuid, modalType }) => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const [isCanceling, setIsCanceling] = useState(false);

  const getModalTitleByType = useCallback(
    (modalType: ModalType) => {
      if (modalType === 'delete') {
        return t('deleteReport', 'Delete report');
      } else if (modalType === 'cancel') {
        return t('cancelReport', 'Cancel report');
      } else if (modalType === 'schedule') {
        return t('scheduleReport', 'Schedule report');
      }
    },
    [t],
  );

  const getModalBodyByType = useCallback(
    (modalType: ModalType) => {
      if (modalType === 'delete') {
        return t('deleteReportModalText', 'Are you sure you want to delete this report?');
      } else if (modalType === 'cancel') {
        return t(
          'cancelActiveReportModalText',
          'Cancel this report? Its request and any generated files will be removed. A running database query may take time to stop.',
        );
      } else if (modalType === 'schedule') {
        return t('deleteReportScheduleModalText', 'Are you sure you want to delete this schedule?');
      }
    },
    [t],
  );

  const getSuccessToastMessageByType = useCallback(
    (modalType: ModalType) => {
      if (modalType === 'delete') {
        return t('reportDeletedSuccessfully', 'Report deleted successfully');
      } else if (modalType === 'cancel') {
        return t('reportCancellationRequested', 'Report cancellation requested');
      } else if (modalType === 'schedule') {
        return t('reportScheduleDeletedSuccessfully', 'Report schedule deleted successfully');
      }
    },
    [t],
  );

  const getFailedToastMessageByType = useCallback(
    (modalType: ModalType) => {
      if (modalType === 'delete') {
        return t('reportDeletingErrorMsg', 'Error during report deleting');
      } else if (modalType === 'cancel') {
        return t('reportCancelingErrorMsg', 'Error during report canceling');
      } else if (modalType === 'schedule') {
        return t('reportScheduleDeletingErrorMsg', 'Error during report schedule deleting');
      }
    },
    [t],
  );

  const getLoadingMessageByType = useCallback(
    (modalType: ModalType) => {
      if (modalType === 'delete' || modalType === 'schedule') {
        return t('deleting', 'Deleting');
      } else if (modalType === 'cancel') {
        return t('cancelling', 'Cancelling');
      }
    },
    [t],
  );

  const callMutates = useCallback(() => {
    mutate(
      (key) =>
        typeof key === 'string' &&
        (key.startsWith('/ws/rest/v1/reportingrest/reportRequest?') ||
          key.startsWith('/ws/rest/v1/reportingrest/reportDefinitionsWithScheduledRequests')),
    );
  }, [mutate]);

  const handleCancel = useCallback(async () => {
    try {
      setIsCanceling(true);
      if (modalType === 'cancel') {
        await cancelActiveReportRequest(reportRequestUuid);
      } else {
        await cancelReportRequest(reportRequestUuid);
      }
      callMutates();
      closeModal();
      showSnackbar({
        kind: 'success',
        title: getModalTitleByType(modalType),
        subtitle: getSuccessToastMessageByType(modalType),
      });
    } catch (error) {
      showSnackbar({
        kind: 'error',
        title: getModalTitleByType(modalType),
        subtitle: getFailedToastMessageByType(modalType),
      });
    } finally {
      setIsCanceling(false);
    }
  }, [
    callMutates,
    closeModal,
    getFailedToastMessageByType,
    getModalTitleByType,
    getSuccessToastMessageByType,
    modalType,
    reportRequestUuid,
  ]);

  return (
    <div>
      <ModalHeader closeModal={closeModal} title={getModalTitleByType(modalType)} />
      <ModalBody>
        <p>{getModalBodyByType(modalType)}</p>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={closeModal}>
          {t('no', 'No')}
        </Button>
        <Button kind="danger" onClick={handleCancel} disabled={isCanceling}>
          {isCanceling ? (
            <InlineLoading description={getLoadingMessageByType(modalType) + '...'} />
          ) : (
            <span>{t('yes', 'Yes')}</span>
          )}
        </Button>
      </ModalFooter>
    </div>
  );
};

export default CancelReportModal;
