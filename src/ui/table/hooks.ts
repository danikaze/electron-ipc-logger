import { useCallback, useEffect, useRef } from 'react';
import { Props } from '.';

export function useIpcTable({
  containerRef,
  lastRowRef,
  data,
  selectedMsg,
  sortBy,
  sortReverse,
  relativeTimes,
  logSizeReached,
  onRowClick,
  setSortBy,
}: Omit<Props, 'className'>) {
  const activeRowRef = useRef<HTMLTableRowElement>(null);

  const sortByN = useCallback(() => setSortBy('n'), [sortBy, sortReverse]);
  const sortByTime = useCallback(() => setSortBy('t'), [sortBy, sortReverse]);
  const sortByMethod = useCallback(
    () => setSortBy('method'),
    [sortBy, sortReverse]
  );
  const sortByChannel = useCallback(
    () => setSortBy('channel'),
    [sortBy, sortReverse]
  );

  useEffect(() => {
    /*
     * This should be called when a new row is selected (click / keyboard)
     * It checks if the active row is outside the screen (which can happen
     * on keyboard shortcuts) and move the scroll to show the row, as it would
     * have happened with native scrolls
     */
    const isLastSelected = selectedMsg === data[data.length - 1];
    // only 1 ref is passed to the row and `lastRowRef` has precedence over
    // `activeRowRef`, so this check is needed
    const row = (isLastSelected ? lastRowRef : activeRowRef).current;
    const container = containerRef.current;
    if (!row || !container) return;
    const containerBounds = container.getBoundingClientRect();
    const rowBounds = row.getBoundingClientRect();
    const headerBounds = container
      .querySelector('thead')
      .getBoundingClientRect();
    const limitTop = containerBounds.y + headerBounds.height;
    const limitBottom = containerBounds.height;

    // row over the view
    if (rowBounds.top < limitTop) {
      container.scrollBy(0, rowBounds.top - limitTop);
    }
    // row below the view
    if (rowBounds.bottom > limitBottom) {
      container.scrollBy(0, rowBounds.bottom - limitBottom);
    }
  }, [activeRowRef.current, containerRef.current]);

  return {
    rows: data,
    lastRowRef,
    activeRowRef,
    selectedMsg,
    relativeTimes,
    sortBy,
    sortReverse,
    logSizeReached,
    onRowClick,
    sortByN,
    sortByTime,
    sortByMethod,
    sortByChannel,
  };
}
