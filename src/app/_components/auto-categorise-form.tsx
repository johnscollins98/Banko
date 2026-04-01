"use client";

import bulkUpdateCategories from "@/lib/actions/auto-categorize/bulk-update-categories";
import fetchTransactionsForMonth from "@/lib/actions/auto-categorize/fetch-previous-month-transactions";
import {
  matchTransactionsByRecipientAndReference,
  TransactionMatch,
} from "@/lib/actions/auto-categorize/match-transactions";
import { Transactions } from "@/lib/starling-types";
import {
  Button,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import React from "react";
import { PiShootingStar } from "react-icons/pi";
import { AutoCategoriseMatchCard } from "./auto-categorise-match-card";
import SafeModal from "./safe-modal";

interface Props {
  currentTransactions: Transactions["feedItems"];
  offset: number;
}

export const AutoCategoriseForm = ({ currentTransactions, offset }: Props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [matches, setMatches] = React.useState<TransactionMatch[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);
  const [successCount, setSuccessCount] = React.useState(0);

  // Determine current state
  const getContentState = ():
    | "loading"
    | "error"
    | "no-matches"
    | "success"
    | "matches"
    | "no-selection" => {
    if (successCount > 0) return "success";
    if (isLoading) return "loading";
    if (error) return "error";
    if (matches.length === 0) return "no-matches";
    return selectedIds.size === 0 ? "no-selection" : "matches";
  };

  const contentState = getContentState();

  const handleOpen = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setMatches([]);
    setSelectedIds(new Set());
    setSuccessCount(0);

    try {
      // Fetch previous month's transactions
      const previousMonthTransactions = await fetchTransactionsForMonth(
        offset - 1,
      );

      // Match transactions
      const transactionMatches = matchTransactionsByRecipientAndReference(
        currentTransactions.filter((i) => i.status !== "DECLINED"),
        previousMonthTransactions.feedItems.filter(
          (i) => i.status !== "DECLINED",
        ),
      );

      setMatches(transactionMatches);
      selectAll(); // Select all by default
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load transactions",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after modal closes
    setTimeout(() => {
      setMatches([]);
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
      matches.map((m) => m.currentTransaction.feedItemUid),
    );
    setSelectedIds(allIds);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;

    setIsSubmitting(true);
    try {
      const updates = matches
        .filter((m) => selectedIds.has(m.currentTransaction.feedItemUid))
        .map((m) => ({
          transactionId: m.currentTransaction.feedItemUid,
          category: m.categoryFromPrevious,
        }));

      await bulkUpdateCategories({ updates });
      setSuccessCount(updates.length);
      setSelectedIds(new Set());
      setMatches([]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update transactions",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render modal content based on state
  const renderModalContent = () => {
    switch (contentState) {
      case "loading":
        return <LoadingContent />;
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
            matches={matches}
            selectedIds={selectedIds}
            onToggle={toggleSelection}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
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
              isSubmitting={isSubmitting}
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
const LoadingContent = () => (
  <div className="flex items-center justify-center py-8">
    <Spinner label="Loading transactions..." />
  </div>
);

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
}

const MatchesList = ({
  matches,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearSelection,
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
          />
        ))}
      </div>
    </div>
  </>
);

interface ModalFooterProps {
  state:
    | "loading"
    | "error"
    | "no-matches"
    | "success"
    | "matches"
    | "no-selection";
  isSubmitting: boolean;
  selectedCount: number;
  onCancel: () => void;
  onSubmit: () => void;
}

const ModalFooter = ({
  state,
  isSubmitting,
  selectedCount,
  onCancel,
  onSubmit,
}: ModalFooterProps) => {
  // States that don't show footer
  if (["loading", "error", "no-matches", "success"].includes(state)) {
    return null;
  }

  return (
    <div className="flex justify-between gap-2">
      <Button color="default" onPress={onCancel} isDisabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        color="primary"
        onPress={onSubmit}
        isLoading={isSubmitting}
        isDisabled={selectedCount === 0}
      >
        Update {selectedCount} Transaction{selectedCount !== 1 ? "s" : ""}
      </Button>
    </div>
  );
};
