"use client";

import bulkUpdateCategories from "@/lib/actions/auto-categorize/bulk-update-categories";
import ignoreTransactionMatch from "@/lib/actions/auto-categorize/ignore-transaction-match";
import { TransactionMatch } from "@/lib/actions/auto-categorize/match-transactions";
import { Button, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import React, { useOptimistic, useTransition } from "react";
import { PiShootingStar } from "react-icons/pi";
import { AutoCategoriseMatchCard } from "./auto-categorise-match-card";
import SafeModal from "./safe-modal";

interface Props {
  matches: TransactionMatch[];
}

export const AutoCategoriseForm = ({ matches }: Props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [pending, startTransition] = useTransition();
  const [, startIgnoreTransition] = useTransition();
  const [optimisticMatches, removeOptimisticMatch] = useOptimistic(
    matches,
    (state: TransactionMatch[], matchToRemove: TransactionMatch) =>
      state.filter(
        (m) =>
          m.currentTransaction.feedItemUid !==
          matchToRemove.currentTransaction.feedItemUid,
      ),
  );
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);
  const [successCount, setSuccessCount] = React.useState(0);

  // Determine current state
  const getContentState = ():
    | "error"
    | "no-matches"
    | "success"
    | "matches"
    | "no-selection" => {
    if (successCount > 0) return "success";
    if (error) return "error";
    if (optimisticMatches.length === 0) return "no-matches";
    return selectedIds.size === 0 ? "no-selection" : "matches";
  };

  const contentState = getContentState();

  const handleOpen = () => {
    setIsOpen(true);
    setError(null);
    setSelectedIds(new Set());
    setSuccessCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after modal closes
    setTimeout(() => {
      setSelectedIds(new Set());
      setError(null);
      setSuccessCount(0);
    }, 300);
  };

  const toggleSelection = (transactionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(
      optimisticMatches.map((m) => m.currentTransaction.feedItemUid),
    );
    setSelectedIds(allIds);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleIgnore = (matchToIgnore: TransactionMatch) => async () => {
    removeOptimisticMatch(matchToIgnore);
    startIgnoreTransition(async () => {
      try {
        await ignoreTransactionMatch({
          currentTransactionId: matchToIgnore.currentTransaction.feedItemUid,
          previousTransactionId: matchToIgnore.previousTransaction.feedItemUid,
        });
        // Remove from selected ids if it was selected
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(matchToIgnore.currentTransaction.feedItemUid);
          return newSet;
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to ignore transaction",
        );
      }
    });
  };

  const handleSubmit = () => {
    if (selectedIds.size === 0) return;

    startTransition(async () => {
      try {
        const updates = optimisticMatches
          .filter((m) => selectedIds.has(m.currentTransaction.feedItemUid))
          .map((m) => ({
            transactionId: m.currentTransaction.feedItemUid,
            category: m.categoryFromPrevious,
          }));

        await bulkUpdateCategories({ updates });
        setSuccessCount(updates.length);
        setSelectedIds(new Set());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update transactions",
        );
      }
    });
  };

  // Render modal content based on state
  const renderModalContent = () => {
    switch (contentState) {
      case "error":
        return <ErrorContent error={error!} onClose={handleClose} />;
      case "no-matches":
        return <NoMatchesContent onClose={handleClose} />;
      case "success":
        return (
          <SuccessContent successCount={successCount} onClose={handleClose} />
        );
      default:
        // "matches" or "no-selection"
        return (
          <MatchesList
            matches={optimisticMatches}
            selectedIds={selectedIds}
            onToggle={toggleSelection}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            onIgnore={handleIgnore}
          />
        );
    }
  };

  return (
    <>
      <div>
        <Button
          onPress={handleOpen}
          className="flex items-center gap-1 sm:hidden"
          isIconOnly
        >
          <PiShootingStar />
        </Button>
        <Button
          className="hidden items-center gap-2 sm:flex"
          onPress={handleOpen}
        >
          <PiShootingStar />
          <span className="hidden sm:inline">Auto Categorise</span>
        </Button>
      </div>
      <SafeModal isOpen={isOpen} onClose={handleClose}>
        <ModalContent>
          <ModalHeader>Auto Categorise</ModalHeader>
          <ModalBody>{renderModalContent()}</ModalBody>
          <div className="px-6 py-4">
            <ModalFooter
              state={contentState}
              isPending={pending}
              selectedCount={selectedIds.size}
              onCancel={handleClose}
              onSubmit={handleSubmit}
            />
          </div>
        </ModalContent>
      </SafeModal>
    </>
  );
};

// Modal content components
interface ErrorContentProps {
  error: string;
  onClose: () => void;
}

const ErrorContent = ({ error, onClose }: ErrorContentProps) => (
  <div className="text-center">
    <div className="mb-4 text-red-600">{error}</div>
    <Button onPress={onClose} color="default">
      Close
    </Button>
  </div>
);

interface NoMatchesContentProps {
  onClose: () => void;
}

const NoMatchesContent = ({ onClose }: NoMatchesContentProps) => (
  <div className="py-8 text-center">
    <p className="text-gray-600">No transactions found to categorise</p>
    <Button onPress={onClose} color="default" className="mt-4">
      Close
    </Button>
  </div>
);

interface SuccessContentProps {
  successCount: number;
  onClose: () => void;
}

const SuccessContent = ({ successCount, onClose }: SuccessContentProps) => (
  <div className="text-center">
    <div className="text-lg font-semibold text-green-600">
      ✓ Updated {successCount} transaction{successCount !== 1 ? "s" : ""}
    </div>
    <Button color="primary" onPress={onClose} className="mt-4">
      Close
    </Button>
  </div>
);

interface MatchesListProps {
  matches: TransactionMatch[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onIgnore: (match: TransactionMatch) => () => Promise<void>;
}

const MatchesList = ({
  matches,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearSelection,
  onIgnore,
}: MatchesListProps) => (
  <>
    <p>
      Here are some transactions we found that look similar to ones from last
      month. Select the ones you want to update to the same category.
    </p>
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="flat" onPress={onSelectAll}>
        Select All
      </Button>
      <Button size="sm" variant="flat" onPress={onClearSelection}>
        Clear
      </Button>
    </div>
    <div className="mb-4 max-h-96 overflow-y-auto">
      <div className="flex flex-col space-y-3">
        {matches.map((match) => (
          <AutoCategoriseMatchCard
            key={match.currentTransaction.feedItemUid}
            match={match}
            isSelected={selectedIds.has(match.currentTransaction.feedItemUid)}
            onToggle={() => onToggle(match.currentTransaction.feedItemUid)}
            onIgnore={onIgnore(match)}
          />
        ))}
      </div>
    </div>
  </>
);

interface ModalFooterProps {
  state: "error" | "no-matches" | "success" | "matches" | "no-selection";
  isPending: boolean;
  selectedCount: number;
  onCancel: () => void;
  onSubmit: () => void;
}

const ModalFooter = ({
  state,
  isPending,
  selectedCount,
  onCancel,
  onSubmit,
}: ModalFooterProps) => {
  // States that don't show footer
  if (["error", "no-matches", "success"].includes(state)) {
    return null;
  }

  return (
    <div className="flex justify-between gap-2">
      <Button color="default" onPress={onCancel} isDisabled={isPending}>
        Cancel
      </Button>
      <Button
        color="primary"
        onPress={onSubmit}
        isLoading={isPending}
        isDisabled={selectedCount === 0}
      >
        Update {selectedCount} Transaction{selectedCount !== 1 ? "s" : ""}
      </Button>
    </div>
  );
};
