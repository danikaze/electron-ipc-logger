import { clsx } from 'clsx';
import { CSSProperties, FC } from 'react';

import { IpcLoggerApi } from '../../shared';
import { DataPanel } from '../data-panel';
import { IpcTable } from '../table';
import { TopBar } from '../top-bar';
import { useRenderer } from './hooks';

import styles from './renderer.module.scss';

export type Props = {
  api: IpcLoggerApi;
};

/**
 * Container view for the renderer.
 * The (small) logic to view messages and data is managed here
 */
export const Renderer: FC<Props> = (props) => {
  const {
    tableContainerRef,
    lastRowRef,
    rows,
    panelPosition,
    panelWidth,
    panelHeight,
    isPanelOpen,
    selectedMsg,
    displayRelativeTimes,
    sortBy,
    sortReverse,
    onDragStart,
    onDrag,
    onMainScroll,
    closePanel,
    setPanelPosition,
    setSelectedIpcMsg,
    setDisplayRelativeTimes,
    setSortCriteria,
    updateFilter,
    clearMessages,
    handleKeyboardEvents,
  } = useRenderer(props);

  const gridStyle = {
    '--data-panel-width': `${panelWidth}px`,
    '--data-panel-height': `${panelHeight}px`,
  } as CSSProperties;

  return (
    <div
      tabIndex={-1}
      onKeyDown={handleKeyboardEvents}
      className={clsx(
        styles.root,
        styles[panelPosition],
        !isPanelOpen && styles.closed
      )}
      style={gridStyle}
    >
      <div className={styles.topBar}>
        <TopBar
          onUseRelativeTimes={setDisplayRelativeTimes}
          relativeTimes={displayRelativeTimes}
          setFilter={updateFilter}
          clearMessages={clearMessages}
        />
      </div>
      <div
        ref={tableContainerRef}
        className={styles.main}
        onScroll={onMainScroll}
      >
        <IpcTable
          containerRef={tableContainerRef}
          lastRowRef={lastRowRef}
          data={rows}
          selectedMsg={selectedMsg}
          relativeTimes={displayRelativeTimes}
          sortBy={sortBy}
          sortReverse={sortReverse}
          setSortBy={setSortCriteria}
          onRowClick={setSelectedIpcMsg}
        />
      </div>
      <div className={styles.panel}>
        {selectedMsg && (
          <>
            <div
              draggable={true}
              className={styles.draggable}
              onDragStart={onDragStart}
              onDrag={onDrag}
            />
            <DataPanel
              position={panelPosition}
              data={selectedMsg}
              relativeTimes={displayRelativeTimes}
              closePanel={closePanel}
              setPanelPosition={setPanelPosition}
            />
          </>
        )}
      </div>
    </div>
  );
};
