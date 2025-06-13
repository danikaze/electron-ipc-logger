import {
  DragEvent,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { throttle } from 'throttle-debounce';

import { Props } from '.';
import { IpcLogData } from '../../shared';
import { PanelPosition, SortableField } from '../types';
import { useUiOptions } from '../ui-options';
import { filterAndSort } from './filter';

type DragData = {
  clientX0: number;
  clientY0: number;
  width0: number;
  height0: number;
  width: number;
  height: number;
  target?: any;
};

const PANEL_MIN_SIZE = 200;
const PANEL_MAX_SIZE_MARGIN = 150;
const RESIZE_THROTTLE = 250;
const NO_MSG_SELECTED = -1;

export function useRenderer({ api }: Props) {
  const options = useUiOptions();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const lastRowRef = useRef<HTMLTableRowElement>(null);
  const autoScrollingRef = useRef(true);
  const firstLogRowRef = useRef(0);
  const logSizeReachedRef = useRef(false);
  const [logData, setLogData] = useState<IpcLogData[]>([]);
  const [filteredRows, setFilteredRows] = useState<IpcLogData[]>([]);
  const [panelPosition, setPanelPosition] = useState<PanelPosition>('right');
  const [panelWidth, setPanelWidth] = useState(300);
  const [panelHeight, setPanelHeight] = useState(200);
  const [isPanelOpen, setPanelOpen] = useState(true);
  const [selectedMsgIndex, setSelectedMsgIndex] =
    useState<number>(NO_MSG_SELECTED);
  const [displayRelativeTimes, setDisplayRelativeTimes] = useState(false);
  const [sortBy, setSortBy] = useState<
    [field: SortableField, reverse: boolean]
  >(['t', false]);
  const [filter, setFilter] = useState<[filter: string, inverted: boolean]>([
    '',
    false,
  ]);

  const dragRef = useRef<DragData>({
    clientX0: 0,
    clientY0: 0,
    width0: panelWidth,
    height0: panelHeight,
    width: panelWidth,
    height: panelHeight,
  });

  const updateAutoScrollState = useCallback(() => {
    const container = tableContainerRef.current;

    // if the panel is open (looking the details of a message) or the newest
    // messages needs to appear on top, there's no need to scroll
    if (isPanelOpen || scrollBy[1] || !container) {
      autoScrollingRef.current = false;
      return;
    }

    // otherwise, the autoscroll enabled when the table is scrolled up to
    // the bottom
    autoScrollingRef.current =
      container.scrollTop + container.getBoundingClientRect().height >=
      container.children[0].clientHeight;
  }, [isPanelOpen, scrollBy, tableContainerRef.current]);

  /*
   * Re-sort the data if any condition is changed
   */
  useEffect(
    () =>
      setFilteredRows((filteredRows) => {
        const currentSelected = filteredRows[selectedMsgIndex];
        const newFilteredRows = filterAndSort(logData, filter, sortBy);
        const newSelectedIndex = currentSelected
          ? newFilteredRows.findIndex((msg) => msg.n === currentSelected.n)
          : NO_MSG_SELECTED;
        setSelectedMsgIndex(newSelectedIndex);
        return newFilteredRows;
      }),
    [logData, filter, sortBy]
  );

  /*
   * Set the listener on IPC messages to add new incoming data from the main
   * process
   *
   * As there are messages that might be just updating previous values (i.e.
   * to update the result from an invoke method), they can't just be appended.
   * Instead, they need to be checked one by one and properly combined.
   * And if the updated value was already cleared, it needs to be thrown away.
   */
  useEffect(() => {
    const listener = (newData: ReadonlyArray<IpcLogData>): void => {
      setLogData((currentData) => {
        let updatedData = [...currentData];

        for (const data of newData) {
          // ignore data already cleared
          if (data.n < firstLogRowRef.current) continue;
          const i = updatedData.findIndex((row) => row.n === data.n);
          if (i !== -1) {
            // existing data might have been updated, so replace it
            updatedData[i] = {
              ...updatedData[i],
              ...data,
            };
          } else {
            // new data is just added to the end
            updatedData.push(data);
          }
        }

        if (options.logSize > 0 && updatedData.length > options.logSize) {
          // TODO: Instead of just keeping the last `logSize` messages, provide
          // pagination (virtual nodes)
          updatedData = updatedData.slice(updatedData.length - options.logSize);
          // technically, this flag could be removed if we didn't care about
          // displaying the msg when the number of messages is the maximum but
          // still not being trimmed (and just compare size with options.logSize)
          logSizeReachedRef.current = true;
        }

        return updatedData;
      });
    };
    api.onUpdate(listener);
  }, []);

  /*
   * Auto-update the state of the DataPanel based on the selected row
   */
  useEffect(() => {
    const isOpen = filteredRows[selectedMsgIndex] !== undefined;
    updateAutoScrollState();
    setPanelOpen(isOpen);
  }, [selectedMsgIndex, filteredRows]);

  useEffect(updateAutoScrollState, [updateAutoScrollState]);

  /*
   * Fix/update the panel size when it's open and the window gets resized
   */
  useEffect(() => {
    const fn = () => {
      if (!isPanelOpen) return;
      updatePanelSize();
    };
    const listener = throttle(RESIZE_THROTTLE, fn);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [isPanelOpen]);

  useEffect(() => {
    // if autoscrolling is disabled, do nothing
    if (!autoScrollingRef.current) return;

    const container = tableContainerRef.current;
    if (!container) return;

    // scroll the container to its bottom
    const containerBounds = container.getBoundingClientRect();
    container.scrollBy(0, containerBounds.height);
  }, [lastRowRef.current]);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setSelectedMsgIndex(NO_MSG_SELECTED);
  }, []);

  const setSelectedIpcMsg = useCallback(
    (n: IpcLogData['n']) => {
      const index = filteredRows.findIndex((msg) => msg.n === n);
      setSelectedMsgIndex(index);
    },
    [filteredRows]
  );

  const setSortCriteria = useCallback(
    (field: SortableField) => {
      const reverse = sortBy[0] === field ? !sortBy[1] : sortBy[1];
      setSortBy([field, reverse]);
    },
    [sortBy]
  );

  const updateFilter = useCallback((filter: string, inverted?: boolean) => {
    setFilter([filter, inverted === true]);
  }, []);

  const updatePanelSize = useCallback(
    (newSize?: number) => {
      const drag = dragRef.current;
      if (panelPosition === 'right') {
        newSize = newSize === undefined ? drag.width : newSize;
        const maxSize = window.innerWidth - PANEL_MAX_SIZE_MARGIN;
        drag.width = Math.min(maxSize, Math.max(PANEL_MIN_SIZE, newSize));
        setPanelWidth(drag.width);
      } else if (panelPosition === 'bottom') {
        newSize = newSize === undefined ? drag.height : newSize;
        const maxSize = window.innerHeight - PANEL_MAX_SIZE_MARGIN;
        drag.height = Math.min(maxSize, Math.max(PANEL_MIN_SIZE, newSize));
        setPanelHeight(drag.height);
      }
    },
    [panelPosition]
  );

  const onDragStart = useCallback(
    (ev: DragEvent) => {
      const drag = dragRef.current;
      if (panelPosition === 'right') {
        drag.clientX0 = ev.clientX;
        drag.width0 = drag.width;
      } else if (panelPosition === 'bottom') {
        drag.clientY0 = ev.clientY;
        drag.height0 = drag.height;
      }
    },
    [panelPosition]
  );

  const onDrag = useCallback(
    (ev: DragEvent) => {
      if (ev.clientX === 0 && ev.clientY === 0) return;
      const drag = dragRef.current;
      const newSize =
        panelPosition === 'right'
          ? drag.width0 + drag.clientX0 - ev.clientX
          : panelPosition === 'bottom'
            ? drag.height0 + drag.clientY0 - ev.clientY
            : undefined;
      updatePanelSize(newSize);
    },
    [panelPosition]
  );

  const clearMessages = useCallback(() => {
    setLogData((logData) => {
      // update what is the first msg to accept (everything else can be ignored)
      if (logData.length) {
        firstLogRowRef.current = logData[logData.length - 1].n + 1;
      }
      return [];
    });
    setSelectedMsgIndex(NO_MSG_SELECTED);
  }, []);

  const handleKeyboardEvents: KeyboardEventHandler<HTMLDivElement> = (ev) => {
    // clear the message log
    if (ev.code === 'KeyL' && (api.isMac ? ev.metaKey : ev.ctrlKey)) {
      ev.preventDefault();
      clearMessages();
      return;
    }

    if (ev.code === 'Escape') {
      closePanel();
    } else if (ev.code === 'ArrowUp') {
      setSelectedMsgIndex((n) =>
        isPanelOpen ? Math.max(0, n - 1) : filteredRows.length - 1
      );
    } else if (ev.code === 'ArrowDown') {
      setSelectedMsgIndex((n) =>
        isPanelOpen ? Math.min(filteredRows.length - 1, n + 1) : 0
      );
    } else if (ev.code === 'PageUp') {
      setSelectedMsgIndex((n) =>
        Math.max(0, (isPanelOpen ? n : filteredRows.length - 1) - 10)
      );
    } else if (ev.code === 'PageDown') {
      setSelectedMsgIndex((n) =>
        Math.min(isPanelOpen ? filteredRows.length - 1 : 10, n + 10)
      );
    } else if (ev.code === 'Home') {
      setSelectedMsgIndex(0);
      return;
    } else if (ev.code === 'End') {
      setSelectedMsgIndex(filteredRows.length - 1);
      return;
    }
  };

  return {
    // basic data
    tableContainerRef,
    lastRowRef,
    startTime: api.startTime,
    rows: filteredRows,
    // calculated data
    panelPosition,
    panelWidth,
    panelHeight,
    isPanelOpen,
    selectedMsgIndex,
    selectedMsg: filteredRows[selectedMsgIndex],
    displayRelativeTimes,
    sortBy: sortBy[0],
    sortReverse: sortBy[1],
    logSizeReached: logSizeReachedRef.current,
    // callbacks
    onDragStart,
    onDrag,
    onMainScroll: updateAutoScrollState,
    closePanel,
    setPanelPosition,
    setSelectedIpcMsg,
    setDisplayRelativeTimes,
    setSortCriteria,
    updateFilter,
    clearMessages,
    handleKeyboardEvents,
  };
}
